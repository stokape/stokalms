// ============================================================================
// auth.service.ts — Aprovisionamiento "Just-In-Time" (JIT) de usuarios.
//
// PROBLEMA que resuelve: Keycloak sabe QUIEN inicio sesion (su identidad),
// pero Keycloak no sabe nada de nuestro modelo de negocio (tenants, roles
// academicos, matriculas...). Nuestra base de datos SI tiene esa
// informacion, en las tablas User/UserTenant (ver
// docs/architecture/02-modelo-de-datos.md, seccion 2.2).
//
// "Just-In-Time" significa: la PRIMERA vez que una persona valida un token
// de Keycloak contra un tenant especifico, creamos automaticamente:
//   1) Su fila en "User" (identidad global), si no existia — buscada por
//      email, para que la MISMA persona con cuentas en varios tenants
//      (ver 02-modelo-de-datos.md) no quede duplicada.
//   2) Su fila en "UserTenant" (membresia en ESTE tenant), si no existia.
//
// Lo que este servicio NO hace, PARA CUALQUIER OTRA PERSONA: asignar un
// ROL automaticamente. Una membresia recien creada queda SIN ningun rol —
// el permiso de "que puede hacer" esta persona en el tenant lo asigna
// despues un Administrador de entidad desde el panel (ver
// docs/architecture/03-rbac.md, seccion 3.3). Auto-asignar un rol por
// defecto seria un riesgo de seguridad: cualquiera que logre iniciar
// sesion terminaria con permisos sin que nadie los haya autorizado
// explicitamente para ESTE tenant.
//
// LA UNICA EXCEPCION: el equipo de PLATAFORMA (PLATFORM_ADMIN_EMAILS, ver
// configuration.ts) — ver "ensureSuperAdminForPlatformAdmins" mas abajo.
// Esas cuentas ya pueden crear/aprobar instituciones y administrar TODA la
// plataforma desde /admin-plataforma; que despues, al entrar a un tenant
// especifico (el suyo propio o el de un tercero, ej. para soporte), se
// encuentren SIN ningun permiso ahi adentro era una inconsistencia real:
// el super usuario terminaba con menos acceso dentro de un tenant que
// cualquier Administrador de entidad normal de ESE tenant.
//
// Relacion con el resto del proyecto:
// - Lo invoca jwt.strategy.ts en cada request autenticado.
// - Usa TenantContextService (ver src/common/tenant/) para saber A QUE
//   tenant esta iniciando sesion esta persona (resuelto por subdominio).
// - Usa PrismaService.withTenant(...) para que la creacion de UserTenant
//   (y, para el equipo de plataforma, tambien la de UserRole) quede
//   sujeta a Row-Level Security igual que cualquier otra escritura.
// ============================================================================

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { CasbinService } from '../rbac/casbin.service';
import { KeycloakJwtPayload } from './jwt.strategy';

// Forma del objeto que termina en "req.user" para el resto de la aplicacion
// (controladores, guards de permisos). Deliberadamente NO incluye datos
// crudos del token de Keycloak: el resto del backend trabaja con conceptos
// de NUESTRO dominio (userId, userTenantId), no con detalles de Keycloak.
export interface AuthenticatedUser {
  userId: string;
  userTenantId: string;
  tenantId: string;
  email: string;
  fullName: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly configService: ConfigService,
    private readonly casbin: CasbinService,
  ) {}

  async findOrProvisionUser(payload: KeycloakJwtPayload): Promise<AuthenticatedUser> {
    // Si el subdominio/dominio de este request no corresponde a NINGUN
    // tenant registrado (ver tenant-context.middleware.ts), no tiene sentido
    // "iniciar sesion en ningun lado" — se corta aqui con un mensaje claro
    // en vez de dejar que, mas adelante, una consulta RLS falle en silencio.
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new UnauthorizedException(
        'Este dominio no corresponde a ninguna institucion registrada en la plataforma.',
      );
    }

    const email = payload.email ?? payload.preferred_username;
    if (!email) {
      throw new UnauthorizedException(
        'El token de Keycloak no incluye un email ni un nombre de usuario utilizable.',
      );
    }

    const fullName =
      payload.name ??
      [payload.given_name, payload.family_name].filter(Boolean).join(' ') ??
      email;

    // "users" (identidad global) NO tiene Row-Level Security (ver el
    // principio de la explicacion en rls-policies.sql), asi que esta
    // consulta puede hacerse con el cliente normal, sin pasar por
    // "withTenant" — buscamos/creamos la persona sin importar el tenant.
    //
    // "firstName"/"lastName" se completan al CREAR y, si todavia estan
    // vacios (cuentas creadas ANTES de que estos campos existieran, ver la
    // migracion "add_profile_fields_and_module_assessments"), tambien se
    // "rellenan" la primera vez que se detectan vacios — pero NUNCA se
    // sobreescribe un valor que ya este cargado: son datos que la pantalla
    // de "Mi perfil" muestra pero no deja editar (ver profile.controller.ts),
    // y un cambio futuro de nombre en Keycloak no deberia pisarlos en
    // silencio.
    const user = await this.prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        fullName,
        firstName: payload.given_name,
        lastName: payload.family_name,
      },
    });

    if (!user.firstName && !user.lastName && (payload.given_name || payload.family_name)) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { firstName: payload.given_name, lastName: payload.family_name },
      });
      user.firstName = payload.given_name ?? null;
      user.lastName = payload.family_name ?? null;
    }

    // "user_tenants" SI tiene Row-Level Security: la busqueda/creacion de la
    // membresia debe correr con el tenant activo fijado (ver
    // src/prisma/prisma.service.ts, metodo withTenant).
    const userTenant = await this.prisma.withTenant(tenantId, async (tx) => {
      const existing = await tx.userTenant.findUnique({
        where: { userId_tenantId: { userId: user.id, tenantId } },
      });
      if (existing) {
        return existing;
      }

      return tx.userTenant.create({
        data: { userId: user.id, tenantId, status: 'active' },
      });
    });

    await this.ensureSuperAdminForPlatformAdmins(email, tenantId, userTenant.id);

    return {
      userId: user.id,
      userTenantId: userTenant.id,
      tenantId,
      email: user.email,
      fullName: user.fullName,
    };
  }

  // ---------------------------------------------------------------------
  // Si quien inicia sesion es del equipo de PLATAFORMA
  // (PLATFORM_ADMIN_EMAILS), le asegura el rol "Super Admin" (uno de los
  // roles del sistema sembrados por prisma/seed.js, ALL_PERMISSIONS —
  // igual de completo que "Administrador de entidad") EN ESTE TENANT, sin
  // importar si es el suyo propio o el de un tercero. Se corre en CADA
  // login (no solo al crear la membresia) para autocurar el caso de una
  // cuenta que ya tenia UserTenant de antes pero sin rol — por eso el
  // primer chequeo es barato (una consulta que casi siempre encuentra la
  // asignacion ya hecha y corta ahi, ver "alreadyAssigned" mas abajo).
  //
  // Por que ADITIVO, nunca destructivo: si el tenant YA le habia asignado
  // otro rol a esta persona (ej. la invito como Docente antes de que
  // pasara a integrar el equipo de plataforma), esta funcion NUNCA se lo
  // quita — solo agrega Super Admin ENCIMA. Un UserTenant puede tener mas
  // de un UserRole (ver schema.prisma, UserRole no tiene un unique sobre
  // userTenantId solo) — el mismo patron que ya permite que alguien sea
  // Docente de un curso Y Estudiante de otro a la vez.
  // ---------------------------------------------------------------------
  private async ensureSuperAdminForPlatformAdmins(
    email: string,
    tenantId: string,
    userTenantId: string,
  ): Promise<void> {
    const platformAdminEmails = this.configService.get<string[]>('platformAdminEmails') ?? [];
    if (!platformAdminEmails.includes(email.toLowerCase())) {
      return;
    }

    // "roles" tampoco tiene Row-Level Security (catalogo compartido, ver
    // rls-policies.sql) — se puede leer con el cliente normal.
    const superAdminRole = await this.prisma.role.findFirst({
      where: { name: 'Super Admin', isSystemRole: true, tenantId: null },
    });
    if (!superAdminRole) {
      // No deberia pasar (prisma/seed.js siempre lo siembra), pero un
      // seed corrido a medias en un entorno nuevo no debe romper el login
      // de nadie — se sigue de largo sin este "extra".
      this.logger.warn(
        'No se encontro el rol de sistema "Super Admin" — no se pudo elevar el acceso del equipo de plataforma en este tenant. Corre "npm run prisma:seed".',
      );
      return;
    }

    const alreadyAssigned = await this.prisma.withTenant(tenantId, (tx) =>
      tx.userRole.findFirst({
        where: { userTenantId, roleId: superAdminRole.id, scopeCourseId: null },
      }),
    );
    if (alreadyAssigned) {
      return;
    }

    await this.prisma.withTenant(tenantId, (tx) =>
      tx.userRole.create({
        data: { tenantId, userTenantId, roleId: superAdminRole.id },
      }),
    );

    // Sin esto, el acceso recien otorgado no regiria hasta que alguien
    // reinicie el backend (ver la nota sobre "reload()" en
    // casbin.service.ts) — mismo criterio que tenant-registration.service.ts
    // al asignarle su rol a un Administrador de entidad recien creado.
    await this.casbin.reload();

    this.logger.log(
      `Acceso de "Super Admin" asegurado para "${email}" (equipo de plataforma) en el tenant "${tenantId}".`,
    );
  }
}
