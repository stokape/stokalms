// ============================================================================
// user.service.ts — Panel de administracion: ver quien pertenece al tenant
// y que roles tiene cada quien, asignar/quitar roles. Hasta ahora esto SOLO
// se podia hacer escribiendo filas a mano en "user_roles" (ver el historial
// de commits) — es el ultimo hueco de "Qué sigue" antes de que una
// institucion real pueda operar sin que alguien le toque la base de datos.
// ============================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CasbinService } from '../../rbac/casbin.service';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { EditUserProfileDto } from './dto/edit-user-profile.dto';
import { BulkAssignRoleDto } from './dto/bulk-assign-role.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly casbin: CasbinService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll() {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const memberships = await tx.userTenant.findMany({
        include: {
          user: true,
          roles: { include: { role: true, scopeCourse: true } },
        },
        orderBy: { user: { fullName: 'asc' } },
      });

      return memberships.map((m) => ({
        userTenantId: m.id,
        email: m.user.email,
        fullName: m.user.fullName,
        status: m.status,
        roles: m.roles.map((ur) => ({
          userRoleId: ur.id,
          roleId: ur.roleId,
          roleName: ur.role.name,
          scopeCourseId: ur.scopeCourseId,
          scopeCourseTitle: ur.scopeCourse?.title ?? null,
        })),
      }));
    });
  }

  // Roles DISPONIBLES para asignar: los base del sistema (tenantId null,
  // compartidos por toda la plataforma) mas los que este tenant en
  // particular haya creado para si mismo (ver docs/architecture/03-rbac.md,
  // seccion 3.3) — hoy no hay pantalla para CREAR roles propios, asi que en
  // la practica esta lista es solo la base, pero la consulta ya contempla
  // el caso para cuando esa pantalla exista.
  async findAssignableRoles() {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.role.findMany({
      where: { OR: [{ tenantId: null }, { tenantId }] },
      orderBy: { name: 'asc' },
    });
  }

  async assignRole(userTenantId: string, dto: AssignRoleDto, actorUserId?: string) {
    const tenantId = this.tenantContext.requireTenantId();

    const { roleName, courseTitle } = await this.prisma.withTenant(tenantId, async (tx) => {
      const userTenant = await tx.userTenant.findUnique({ where: { id: userTenantId } });
      if (!userTenant) {
        throw new NotFoundException(`No existe la membresia "${userTenantId}" en este tenant.`);
      }

      const role = await tx.role.findUnique({ where: { id: dto.roleId } });
      if (!role || (role.tenantId !== null && role.tenantId !== tenantId)) {
        throw new NotFoundException(`No existe el rol "${dto.roleId}" disponible para este tenant.`);
      }

      let courseTitle: string | undefined;
      if (dto.scopeCourseId) {
        const course = await tx.course.findUnique({ where: { id: dto.scopeCourseId } });
        if (!course) {
          throw new NotFoundException(`No existe el curso "${dto.scopeCourseId}" en este tenant.`);
        }
        courseTitle = course.title;
      }

      await tx.userRole.create({
        data: {
          tenantId,
          userTenantId,
          roleId: dto.roleId,
          scopeCourseId: dto.scopeCourseId,
        },
      });

      return { roleName: role.name, courseTitle };
    });

    // El rol asignado debe quedar VIGENTE de inmediato, sin esperar a que
    // alguien reinicie el backend — mismo patron ya usado al aprobar una
    // institucion nueva (ver tenant-registration.service.ts, "approve").
    await this.casbin.reload();
    await this.auditService.record(tenantId, {
      userId: actorUserId,
      action: 'role.assigned',
      payload: { userTenantId, roleId: dto.roleId, scopeCourseId: dto.scopeCourseId ?? null },
    });

    await this.notificationService.notify(userTenantId, {
      type: 'role_assigned',
      title: `Se te asignó el rol "${roleName}"`,
      body: courseTitle ? `Solo en el curso "${courseTitle}".` : undefined,
      link: '/perfil',
    });

    return { assigned: true };
  }

  // "Gestion avanzada de usuarios": asignar un rol a MUCHAS personas de una
  // sola vez (ej. "todo este CSV de docentes nuevos, rol Docente") — mismo
  // patron fila-por-fila que enrollment.service.ts#bulkCreate: un email que
  // no corresponde a nadie de este tenant es una fila con error MAS en el
  // resultado, nunca motivo para tumbar el resto del archivo.
  async bulkAssignRole(dto: BulkAssignRoleDto, actorUserId?: string) {
    const tenantId = this.tenantContext.requireTenantId();
    const results: Array<{ email: string; status: 'asignado' | 'ya_tenia' | 'error'; message?: string }> = [];
    // Se notifica DESPUES de que la transaccion cierre (ver assignRole,
    // mismo criterio) — juntar los pares aca evita abrir una transaccion
    // nueva por fila mientras la de arriba todavia esta abierta.
    const newlyAssigned: Array<{ userTenantId: string; roleName: string }> = [];

    await this.prisma.withTenant(tenantId, async (tx) => {
      for (const row of dto.rows) {
        try {
          const userTenant = await tx.userTenant.findFirst({
            where: { user: { email: row.email } },
            include: { roles: true },
          });
          if (!userTenant) {
            results.push({
              email: row.email,
              status: 'error',
              message: 'No hay nadie con ese email en esta institución.',
            });
            continue;
          }

          const role = await tx.role.findUnique({ where: { id: row.roleId } });
          if (!role || (role.tenantId !== null && role.tenantId !== tenantId)) {
            results.push({ email: row.email, status: 'error', message: 'El rol indicado no existe.' });
            continue;
          }

          // "Ya tenia" no es un error — una fila repetida en el mismo CSV
          // (o alguien que ya tenia el rol de antes) no deberia frenar la
          // carga del resto, solo informarse aparte de "asignado".
          const alreadyHasRole = userTenant.roles.some(
            (r) => r.roleId === row.roleId && r.scopeCourseId === null,
          );
          if (alreadyHasRole) {
            results.push({ email: row.email, status: 'ya_tenia' });
            continue;
          }

          await tx.userRole.create({
            data: { tenantId, userTenantId: userTenant.id, roleId: row.roleId },
          });
          results.push({ email: row.email, status: 'asignado' });
          newlyAssigned.push({ userTenantId: userTenant.id, roleName: role.name });
        } catch (err) {
          results.push({
            email: row.email,
            status: 'error',
            message: err instanceof Error ? err.message : 'Error inesperado.',
          });
        }
      }
    });

    // Una sola recarga al final (no una por fila): recargar el enforcer de
    // Casbin es relativamente caro (relee TODA la tabla de politicas, ver
    // casbin.service.ts) — hacerlo una vez al final de un CSV de 50 filas
    // en vez de 50 veces es la misma garantia de "vigente de inmediato" sin
    // el costo repetido.
    await this.casbin.reload();
    await this.auditService.record(tenantId, {
      userId: actorUserId,
      action: 'role.bulk_assigned',
      payload: {
        total: dto.rows.length,
        asignados: results.filter((r) => r.status === 'asignado').length,
        errores: results.filter((r) => r.status === 'error').length,
      },
    });

    for (const { userTenantId, roleName } of newlyAssigned) {
      await this.notificationService.notify(userTenantId, {
        type: 'role_assigned',
        title: `Se te asignó el rol "${roleName}"`,
        link: '/perfil',
      });
    }

    return { results };
  }

  private async requireUserTenant(userTenantId: string) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, async (tx) => {
      const userTenant = await tx.userTenant.findUnique({
        where: { id: userTenantId },
        include: { user: true },
      });
      if (!userTenant) {
        throw new NotFoundException(`No existe la membresia "${userTenantId}" en este tenant.`);
      }
      return userTenant;
    });
  }

  // Los mismos campos de contacto/residencia que "Mi perfil" (ver
  // profile.service.ts, getMine) pero para OTRA persona — sirve para
  // precargar el formulario de edicion.
  async getProfile(userTenantId: string) {
    const userTenant = await this.requireUserTenant(userTenantId);
    const { user } = userTenant;
    return {
      email: user.email,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      department: user.department,
      province: user.province,
      district: user.district,
    };
  }

  async updateProfile(userTenantId: string, dto: EditUserProfileDto) {
    const userTenant = await this.requireUserTenant(userTenantId);
    const tenantId = this.tenantContext.requireTenantId();

    await this.prisma.withTenant(tenantId, (tx) =>
      tx.user.update({
        where: { id: userTenant.userId },
        data: {
          ...(dto.firstName !== undefined && { firstName: dto.firstName }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.address !== undefined && { address: dto.address }),
          ...(dto.department !== undefined && { department: dto.department }),
          ...(dto.province !== undefined && { province: dto.province }),
          ...(dto.district !== undefined && { district: dto.district }),
        },
      }),
    );

    return { updated: true };
  }

  async removeRole(userTenantId: string, userRoleId: string, actorUserId?: string) {
    const tenantId = this.tenantContext.requireTenantId();

    await this.prisma.withTenant(tenantId, async (tx) => {
      const userRole = await tx.userRole.findUnique({ where: { id: userRoleId } });
      if (!userRole || userRole.userTenantId !== userTenantId) {
        throw new NotFoundException(`No existe la asignacion "${userRoleId}" para ese usuario.`);
      }
      await tx.userRole.delete({ where: { id: userRoleId } });
    });

    await this.casbin.reload();
    await this.auditService.record(tenantId, {
      userId: actorUserId,
      action: 'role.removed',
      payload: { userTenantId, userRoleId },
    });

    return { removed: true };
  }
}
