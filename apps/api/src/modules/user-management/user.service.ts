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
import { AssignRoleDto } from './dto/assign-role.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly casbin: CasbinService,
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

  async assignRole(userTenantId: string, dto: AssignRoleDto) {
    const tenantId = this.tenantContext.requireTenantId();

    await this.prisma.withTenant(tenantId, async (tx) => {
      const userTenant = await tx.userTenant.findUnique({ where: { id: userTenantId } });
      if (!userTenant) {
        throw new NotFoundException(`No existe la membresia "${userTenantId}" en este tenant.`);
      }

      const role = await tx.role.findUnique({ where: { id: dto.roleId } });
      if (!role || (role.tenantId !== null && role.tenantId !== tenantId)) {
        throw new NotFoundException(`No existe el rol "${dto.roleId}" disponible para este tenant.`);
      }

      if (dto.scopeCourseId) {
        const course = await tx.course.findUnique({ where: { id: dto.scopeCourseId } });
        if (!course) {
          throw new NotFoundException(`No existe el curso "${dto.scopeCourseId}" en este tenant.`);
        }
      }

      await tx.userRole.create({
        data: {
          tenantId,
          userTenantId,
          roleId: dto.roleId,
          scopeCourseId: dto.scopeCourseId,
        },
      });
    });

    // El rol asignado debe quedar VIGENTE de inmediato, sin esperar a que
    // alguien reinicie el backend — mismo patron ya usado al aprobar una
    // institucion nueva (ver tenant-registration.service.ts, "approve").
    await this.casbin.reload();

    return { assigned: true };
  }

  async removeRole(userTenantId: string, userRoleId: string) {
    const tenantId = this.tenantContext.requireTenantId();

    await this.prisma.withTenant(tenantId, async (tx) => {
      const userRole = await tx.userRole.findUnique({ where: { id: userRoleId } });
      if (!userRole || userRole.userTenantId !== userTenantId) {
        throw new NotFoundException(`No existe la asignacion "${userRoleId}" para ese usuario.`);
      }
      await tx.userRole.delete({ where: { id: userRoleId } });
    });

    await this.casbin.reload();

    return { removed: true };
  }
}
