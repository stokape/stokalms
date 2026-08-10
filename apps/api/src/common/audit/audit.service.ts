// ============================================================================
// audit.service.ts — "Seguridad avanzada" (plan Enterprise, ver
// lib/pricing.ts): registro de auditoria de acciones sensibles (cambios de
// rol, marca, certificados, matriculas, cohortes). El modelo AuditLog ya
// existia en el schema desde antes (pensado para esto, ver su comentario),
// pero nada lo escribia todavia — mismo punto de partida que
// TenantFeature antes de automations.service.ts.
//
// A PROPOSITO no es un interceptor/decorador global que audite TODO
// automaticamente: eso terminaria registrando de mas (cada GET, cada
// polling) y de menos a la vez (un cambio real hecho en dos pasos se veria
// como dos eventos sueltos, sin contexto). En cambio, cada servicio de
// negocio llama a "record()" EXPLICITAMENTE en el puñado de acciones que
// de verdad importan auditar (ver los call-sites: user.service.ts,
// tenant.service.ts, certificate.service.ts, enrollment.service.ts,
// cohort.service.ts) — la lista corta y deliberada, no el barrido ancho.
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Corre en SU PROPIA transaccion, fuera de la del llamador — un fallo al
  // escribir la auditoria (ej. la base de datos justo se cayo) nunca debe
  // revertir ni bloquear la accion real que la origino (mismo criterio de
  // "no romper la operacion principal" que automations.service.ts aplica
  // al envio de correo). Por eso atrapa cualquier error y solo lo loguea.
  async record(
    tenantId: string,
    params: { userId?: string | null; action: string; payload?: Record<string, unknown> },
  ): Promise<void> {
    try {
      await this.prisma.withTenant(tenantId, (tx) =>
        tx.auditLog.create({
          data: {
            tenantId,
            userId: params.userId ?? undefined,
            action: params.action,
            payload: (params.payload ?? {}) as Prisma.InputJsonValue,
          },
        }),
      );
    } catch (err) {
      this.logger.warn(
        `No se pudo registrar el evento de auditoria "${params.action}": ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
