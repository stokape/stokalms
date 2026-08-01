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
// Lo que este servicio NO hace: asignar un ROL automaticamente. Una
// membresia recien creada queda SIN ningun rol — el permiso de "que puede
// hacer" esta persona en el tenant lo asigna despues un Administrador de
// entidad desde el panel (ver docs/architecture/03-rbac.md, seccion 3.3).
// Auto-asignar un rol por defecto seria un riesgo de seguridad: cualquiera
// que logre iniciar sesion terminaria con permisos sin que nadie los haya
// autorizado explicitamente para ESTE tenant.
//
// Relacion con el resto del proyecto:
// - Lo invoca jwt.strategy.ts en cada request autenticado.
// - Usa TenantContextService (ver src/common/tenant/) para saber A QUE
//   tenant esta iniciando sesion esta persona (resuelto por subdominio).
// - Usa PrismaService.withTenant(...) para que la creacion de UserTenant
//   quede sujeta a Row-Level Security igual que cualquier otra escritura.
// ============================================================================

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
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
    const user = await this.prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, fullName },
    });

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

    return {
      userId: user.id,
      userTenantId: userTenant.id,
      tenantId,
      email: user.email,
      fullName: user.fullName,
    };
  }
}
