// ============================================================================
// security.service.ts — "Seguridad avanzada" (plan Enterprise, ver
// lib/pricing.ts): dos piezas concretas.
//
//   1) Exigir segundo factor (2FA/TOTP) a los miembros del tenant, apoyado
//      en Keycloak (que YA es el proveedor de identidad real de toda la
//      plataforma, ver keycloak-admin.service.ts) — no es un sistema de
//      2FA propio, es activar el que Keycloak ya sabe hacer.
//   2) Consultar/exportar el registro de auditoria (ver audit.service.ts).
//
// LO QUE A PROPOSITO NO INCLUYE, y por que: politicas de contraseña o de
// expiracion de sesion PERSONALIZADAS por tenant. Keycloak, tal como esta
// desplegado hoy (ver scripts/setup-keycloak.js), es UN SOLO realm
// compartido por TODAS las instituciones — esas politicas son de REALM
// ENTERO, no por-cliente-OIDC ni por-usuario. Ofrecerlas de verdad
// requeriria un realm por tenant (cambio de arquitectura, ver ADR-003),
// no una funcion mas de este servicio. Se documenta esta limitacion en vez
// de fingir un boton que no cambiaria nada de verdad.
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { KeycloakAdminService } from '../../auth/keycloak-admin.service';
import { AuditService } from '../../common/audit/audit.service';
import { toCsv } from '../../common/csv/csv.util';

const FEATURE_KEY = 'require_2fa';

interface AuditLogRow {
  createdAt: string;
  userEmail: string;
  action: string;
  payload: string;
}

@Injectable()
export class SecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly keycloakAdmin: KeycloakAdminService,
    private readonly auditService: AuditService,
  ) {}

  // --- Exigir 2FA -----------------------------------------------------------

  async getSettings() {
    const tenantId = this.tenantContext.requireTenantId();
    // "tenant_features" SI tiene Row-Level Security (ver rls-policies.sql)
    // — un SELECT directo sin "withTenant" no lanza error (a diferencia de
    // un INSERT/UPDATE), pero silenciosamente no encuentra NADA (RLS lo
    // filtra), asi que siempre "parecia" devolver false — mismo motivo que
    // el bug real que se encontro en updateSettings, ver abajo.
    const feature = await this.prisma.withTenant(tenantId, (tx) =>
      tx.tenantFeature.findUnique({
        where: { tenantId_featureKey: { tenantId, featureKey: FEATURE_KEY } },
      }),
    );
    return { require2FA: feature?.enabled ?? false };
  }

  // Al PRENDERLO, se aplica de una a quienes YA son miembros hoy (ver la
  // nota extensa en keycloak-admin.service.ts, "requireTotpForUser") — a
  // proposito NO reintenta con quien ya se le aplico, ni retira el pedido
  // pendiente si mas tarde se apaga (Keycloak ya se lo pidio una vez; se
  // prefiere que lo termine de configurar antes que dejarlo "a medias").
  async updateSettings(user: { userId: string; tenantId: string }, require2FA: boolean) {
    const tenantId = this.tenantContext.requireTenantId();

    // "tenant_features" SI tiene Row-Level Security — sin "withTenant" (que
    // fija app.current_tenant) este INSERT/UPDATE viola la politica
    // "WITH CHECK" implicita y Postgres lo rechaza (error real encontrado
    // probando esto en vivo: HTTP 500, "new row violates row-level
    // security policy"). Mismo bug, mismo arreglo, que cohort.service.ts
    // tuvo en su momento.
    await this.prisma.withTenant(tenantId, (tx) =>
      tx.tenantFeature.upsert({
        where: { tenantId_featureKey: { tenantId, featureKey: FEATURE_KEY } },
        update: { enabled: require2FA },
        create: { tenantId, featureKey: FEATURE_KEY, enabled: require2FA },
      }),
    );

    let appliedTo: number | undefined;
    let pending: number | undefined;
    if (require2FA) {
      const members = await this.prisma.withTenant(tenantId, (tx) =>
        tx.userTenant.findMany({ where: { status: 'active' }, include: { user: true } }),
      );

      appliedTo = 0;
      pending = 0;
      for (const member of members) {
        try {
          const result = await this.keycloakAdmin.requireTotpForUser(member.user.email);
          if (result.applied) appliedTo++;
          else pending++;
        } catch {
          // Una cuenta que falla (ej. Keycloak momentaneamente lento) no
          // debe frenar al resto del lote — mismo criterio que
          // user.service.ts, "bulkAssignRole".
          pending++;
        }
      }
    }

    await this.auditService.record(tenantId, {
      userId: user.userId,
      action: 'security.require_2fa_updated',
      payload: { require2FA, appliedTo, pending },
    });

    return { require2FA, appliedTo, pending };
  }

  // --- Auditoria --------------------------------------------------------

  async getAuditLogs(limit = 100) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, async (tx) => {
      const logs = await tx.auditLog.findMany({
        include: { user: { select: { email: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 500),
      });
      return logs.map((l) => ({
        id: l.id,
        createdAt: l.createdAt,
        action: l.action,
        payload: l.payload,
        userEmail: l.user?.email ?? null,
        userFullName: l.user?.fullName ?? null,
      }));
    });
  }

  async getAuditLogsCsv(): Promise<string> {
    const logs = await this.getAuditLogs(500);
    const rows: AuditLogRow[] = logs.map((l) => ({
      createdAt: new Date(l.createdAt).toLocaleString('es-PE'),
      userEmail: l.userEmail ?? '(sistema)',
      action: l.action,
      payload: JSON.stringify(l.payload),
    }));
    return toCsv(rows, [
      { key: 'createdAt', header: 'Fecha' },
      { key: 'userEmail', header: 'Quién' },
      { key: 'action', header: 'Acción' },
      { key: 'payload', header: 'Detalle' },
    ]);
  }
}
