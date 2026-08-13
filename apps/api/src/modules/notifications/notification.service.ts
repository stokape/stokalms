// ============================================================================
// notification.service.ts — Avisos cortos dirigidos a UNA persona dentro
// del tenant (ver schema.prisma, modelo Notification). Dos responsabilidades
// bien separadas:
//
//   1. "notify(...)" — la usan OTROS servicios (hoy: asignar rol, emitir
//      certificado) para dejar un aviso cuando pasa algo relevante para
//      alguien puntual. Deliberadamente silenciosa ante errores: un fallo
//      al crear la notificacion NUNCA debe tumbar la operacion real (asignar
//      el rol, emitir el certificado) que la origino — se atrapa y se loguea.
//   2. El resto de metodos — los usa el propio dueño de la notificacion,
//      via NotificationController ("GET /notifications", la campana del
//      panel), para leer y marcar como leidas las suyas.
//
// Sin canales de entrega (solo in-app) y sin preferencias por persona, a
// proposito: MVP minimo que ya resuelve el problema real ("me perdi que me
// asignaron un rol nuevo"/"no me entere que mi certificado ya estaba listo"),
// sin construir infraestructura de email/push que nadie pidio todavia.
// ============================================================================

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { AuthenticatedUser } from '../../auth/auth.service';

export interface NotifyParams {
  type: string;
  title: string;
  body?: string;
  link?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  // "best effort": a quien dispara un evento de negocio (asignar un rol,
  // emitir un certificado) no le importa ni debe enterarse si avisar
  // fallo — por eso atrapa su propio error en vez de dejarlo propagarse.
  async notify(userTenantId: string, params: NotifyParams): Promise<void> {
    try {
      const tenantId = this.tenantContext.requireTenantId();
      await this.prisma.withTenant(tenantId, (tx) =>
        tx.notification.create({
          data: {
            tenantId,
            userTenantId,
            type: params.type,
            title: params.title,
            body: params.body,
            link: params.link,
          },
        }),
      );
    } catch (err) {
      this.logger.warn(
        `No se pudo crear la notificacion "${params.type}" para "${userTenantId}": ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  // Ultimas 30 — la campana es para avisos RECIENTES, no un archivo
  // historico completo (si hiciera falta eso mas adelante, es un filtro
  // nuevo, no el comportamiento por defecto de esta lista).
  async findMine(user: AuthenticatedUser) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.notification.findMany({
        where: { userTenantId: user.userTenantId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    );
  }

  async unreadCount(user: AuthenticatedUser) {
    const tenantId = this.tenantContext.requireTenantId();
    const count = await this.prisma.withTenant(tenantId, (tx) =>
      tx.notification.count({ where: { userTenantId: user.userTenantId, read: false } }),
    );
    return { count };
  }

  async markRead(user: AuthenticatedUser, id: string) {
    const tenantId = this.tenantContext.requireTenantId();
    await this.prisma.withTenant(tenantId, async (tx) => {
      const notification = await tx.notification.findUnique({ where: { id } });
      // Ownership explicito, no solo RLS: RLS ya garantiza que sea del
      // MISMO tenant, pero nada impide que otra persona del mismo tenant
      // (ej. otro Docente) adivine el id de una notificacion ajena.
      if (!notification || notification.userTenantId !== user.userTenantId) {
        throw new NotFoundException(`No existe la notificación "${id}".`);
      }
      await tx.notification.update({ where: { id }, data: { read: true } });
    });
    return { read: true };
  }

  async markAllRead(user: AuthenticatedUser) {
    const tenantId = this.tenantContext.requireTenantId();
    await this.prisma.withTenant(tenantId, (tx) =>
      tx.notification.updateMany({
        where: { userTenantId: user.userTenantId, read: false },
        data: { read: true },
      }),
    );
    return { read: true };
  }
}
