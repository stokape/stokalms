// ============================================================================
// tenant-registration.service.ts — Alta de instituciones nuevas. Dos
// caminos, un solo motor:
//   1) Solicitud publica (/registro-institucion) -> PENDIENTE -> alguien
//      con permiso de administrador de PLATAFORMA la aprueba o rechaza
//      (ver la nota extensa en TenantRegistrationRequest, schema.prisma).
//   2) Alta DIRECTA (createDirect): el administrador de plataforma crea la
//      institucion el mismo, sin pasar por el formulario publico (util
//      para instituciones que se coordinan por otro canal, demos, o el
//      primer tenant de una instalacion nueva) — se guarda IGUAL una fila
//      en tenant_registration_requests, ya aprobada, para que quede en el
//      mismo historial que /admin-plataforma/solicitudes muestra.
//
// Ambos caminos terminan en "provisionTenant": crea el Tenant, su dominio,
// la membresia de la persona de contacto con rol "Administrador de
// entidad", Y su cuenta de Keycloak (ver keycloak-admin.service.ts) con
// una contraseña temporal de un solo uso.
// ============================================================================

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CasbinService } from '../../rbac/casbin.service';
import { KeycloakAdminService } from '../../auth/keycloak-admin.service';
import { CreateTenantRegistrationDto } from './dto/create-tenant-registration.dto';
import { RejectTenantRegistrationDto } from './dto/reject-tenant-registration.dto';

export interface ProvisionedTenant {
  tenantId: string;
  domain: string;
  // null si no se pudo generar (ver "keycloakWarning") o si la cuenta de
  // Keycloak YA existia de antes — en ambos casos no hay nada nuevo que
  // mostrarle a nadie.
  temporaryPassword: string | null;
  // Presente SOLO si algo relacionado a Keycloak no salio como se
  // esperaba (la cuenta ya existia, o la creacion fallo) — el tenant en SI
  // se crea igual, esto es informativo para quien aprobo/creo.
  keycloakWarning: string | null;
}

@Injectable()
export class TenantRegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly casbin: CasbinService,
    private readonly keycloakAdmin: KeycloakAdminService,
  ) {}

  async create(dto: CreateTenantRegistrationDto) {
    // "tenant_registration_requests" no tiene Row-Level Security (ver la
    // nota en rls-policies.sql) — esta consulta y la de abajo corren con
    // el cliente normal, sin pasar por "withTenant", porque todavia no hay
    // NINGUN tenant en juego.
    const existingDomain = await this.prisma.tenantDomain.findUnique({
      where: { domain: this.buildDomain(dto.desiredSubdomain) },
    });
    if (existingDomain) {
      throw new ConflictException(
        `El subdominio "${dto.desiredSubdomain}" ya esta en uso por otra institucion.`,
      );
    }

    const existingPendingRequest = await this.prisma.tenantRegistrationRequest.findFirst({
      where: { desiredSubdomain: dto.desiredSubdomain, status: 'pending' },
    });
    if (existingPendingRequest) {
      throw new ConflictException(
        `Ya hay una solicitud pendiente para el subdominio "${dto.desiredSubdomain}".`,
      );
    }

    return this.prisma.tenantRegistrationRequest.create({
      data: {
        institutionName: dto.institutionName,
        desiredSubdomain: dto.desiredSubdomain,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        message: dto.message,
      },
    });
  }

  async findAll(status?: string) {
    return this.prisma.tenantRegistrationRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string): Promise<ProvisionedTenant> {
    const request = await this.findPendingOrThrow(id);
    const domain = this.buildDomain(request.desiredSubdomain);

    // Revalidacion de ultimo momento: entre que se creo la solicitud y que
    // alguien la aprueba puede haber pasado bastante tiempo, en el que otra
    // solicitud con el mismo subdominio podria haberse aprobado primero.
    const existingDomain = await this.prisma.tenantDomain.findUnique({ where: { domain } });
    if (existingDomain) {
      throw new ConflictException(`El dominio "${domain}" ya esta en uso por otra institucion.`);
    }

    const result = await this.provisionTenant({
      institutionName: request.institutionName,
      desiredSubdomain: request.desiredSubdomain,
      contactName: request.contactName,
      contactEmail: request.contactEmail,
    });

    await this.prisma.tenantRegistrationRequest.update({
      where: { id },
      data: { status: 'approved', reviewedAt: new Date(), createdTenantId: result.tenantId },
    });

    return result;
  }

  // Alta DIRECTA: mismo motor que "approve", pero sin exigir que exista
  // una solicitud pendiente de antes — protegida por PlatformAdminGuard
  // en el controller (ver la nota grande de arriba).
  async createDirect(dto: CreateTenantRegistrationDto): Promise<ProvisionedTenant> {
    const domain = this.buildDomain(dto.desiredSubdomain);
    const existingDomain = await this.prisma.tenantDomain.findUnique({ where: { domain } });
    if (existingDomain) {
      throw new ConflictException(`El subdominio "${dto.desiredSubdomain}" ya esta en uso por otra institucion.`);
    }

    const result = await this.provisionTenant({
      institutionName: dto.institutionName,
      desiredSubdomain: dto.desiredSubdomain,
      contactName: dto.contactName,
      contactEmail: dto.contactEmail,
    });

    // Se guarda IGUAL en el historial de solicitudes (ya "approved" desde
    // el vamos) — ver la nota grande de arriba sobre por que.
    await this.prisma.tenantRegistrationRequest.create({
      data: {
        institutionName: dto.institutionName,
        desiredSubdomain: dto.desiredSubdomain,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        message: dto.message,
        status: 'approved',
        reviewedAt: new Date(),
        createdTenantId: result.tenantId,
      },
    });

    return result;
  }

  async reject(id: string, dto: RejectTenantRegistrationDto) {
    await this.findPendingOrThrow(id);
    return this.prisma.tenantRegistrationRequest.update({
      where: { id },
      data: { status: 'rejected', reviewedAt: new Date(), rejectionReason: dto.reason },
    });
  }

  // ----------------------------------------------------------------------
  // El motor compartido: crea el Tenant, su dominio, la membresia de la
  // persona de contacto (rol "Administrador de entidad") y su cuenta de
  // Keycloak. Reusado por "approve" y "createDirect" — NO revalida que el
  // dominio este libre (cada llamador ya lo hizo con el mensaje de error
  // que le corresponde a SU flujo).
  // ----------------------------------------------------------------------
  private async provisionTenant(params: {
    institutionName: string;
    desiredSubdomain: string;
    contactName: string;
    contactEmail: string;
  }): Promise<ProvisionedTenant> {
    const domain = this.buildDomain(params.desiredSubdomain);

    // El rol "Administrador de entidad" es uno de los roles DEL SISTEMA
    // sembrados por prisma/seed.js (tenantId = null, compartido por toda
    // la plataforma) — no se crea uno nuevo por institucion.
    const adminRole = await this.prisma.role.findFirst({
      where: { name: 'Administrador de entidad', isSystemRole: true, tenantId: null },
    });
    if (!adminRole) {
      throw new ConflictException(
        'No se encontro el rol "Administrador de entidad" — corre "npm run prisma:seed" primero.',
      );
    }

    const tenant = await this.prisma.tenant.create({ data: { name: params.institutionName } });
    await this.prisma.tenantDomain.create({
      data: { tenantId: tenant.id, domain, isPrimary: true },
    });

    // "users" tampoco tiene RLS (identidad global, ver rls-policies.sql):
    // se busca-o-crea por email igual que en cualquier otro flujo de
    // aprovisionamiento (auth.service.ts, enrollment.service.ts).
    const user = await this.prisma.user.upsert({
      where: { email: params.contactEmail },
      update: {},
      create: { email: params.contactEmail, fullName: params.contactName },
    });

    // "user_tenants" y "user_roles" SI tienen RLS — recien AHORA existe un
    // tenantId (el que se acaba de crear arriba) para fijar con
    // "withTenant", igual que en cualquier otra escritura de negocio.
    await this.prisma.withTenant(tenant.id, async (tx) => {
      const userTenant = await tx.userTenant.create({
        data: { userId: user.id, tenantId: tenant.id, status: 'active' },
      });
      await tx.userRole.create({
        data: { tenantId: tenant.id, userTenantId: userTenant.id, roleId: adminRole.id },
      });
    });

    // Sin esto, el nuevo Administrador de entidad tendria que esperar a
    // que alguien REINICIE el backend para que su rol recien creado surta
    // efecto (ver la nota en CasbinService sobre por que las politicas se
    // cargan una vez al iniciar) — recargar aca lo deja listo para
    // iniciar sesion de inmediato.
    await this.casbin.reload();

    // Keycloak se toca AL FINAL, despues de que el tenant ya es 100%
    // funcional en la base de datos: si fallara (esta caido, timeout),
    // preferimos un tenant creado con un aviso claro de "el login todavia
    // no funciona" antes que perder TODO el alta por un problema de un
    // sistema aparte (degradacion cuidadosa, mismo criterio que el resto de
    // la app — ver getPermissions en lib/api.ts del frontend). Dos pasos
    // INDEPENDIENTES, cada uno con su propio try/catch: que uno falle no
    // debe impedir que se intente el otro.
    const warnings: string[] = [];

    try {
      await this.keycloakAdmin.registerRedirectUri(domain);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      warnings.push(
        `No se pudo registrar el dominio "${domain}" en Keycloak automaticamente (${message}). Sin esto, nadie va a poder iniciar sesion en esta institucion hasta que se agregue a mano en el cliente "stoka-web" (redirectUris/webOrigins/post.logout.redirect.uris).`,
      );
    }

    let temporaryPassword: string | null = null;
    try {
      const provisioned = await this.keycloakAdmin.provisionUser({
        email: params.contactEmail,
        fullName: params.contactName,
      });
      temporaryPassword = provisioned.temporaryPassword;
      if (provisioned.alreadyExisted) {
        warnings.push(
          'Ya existia una cuenta de Keycloak con este email — esa persona puede iniciar sesion aca con su contraseña habitual, no hay una nueva que mostrar.',
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      warnings.push(
        `No se pudo crear la cuenta de Keycloak automaticamente (${message}). Creala a mano — ver scripts/setup-keycloak.js como referencia.`,
      );
    }

    return {
      tenantId: tenant.id,
      domain,
      temporaryPassword,
      keycloakWarning: warnings.length > 0 ? warnings.join(' ') : null,
    };
  }

  private async findPendingOrThrow(id: string) {
    const request = await this.prisma.tenantRegistrationRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException(`No existe la solicitud "${id}".`);
    }
    if (request.status !== 'pending') {
      throw new ConflictException(
        `Esta solicitud ya fue ${request.status === 'approved' ? 'aprobada' : 'rechazada'} anteriormente.`,
      );
    }
    return request;
  }

  private buildDomain(subdomain: string): string {
    const rootDomain = this.configService.get<string>('platformRootDomain');
    return `${subdomain}.${rootDomain}`;
  }
}
