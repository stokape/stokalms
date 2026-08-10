// ============================================================================
// cohort.service.ts — Cohortes: agrupar alumnos (ej. "Promoción 2026",
// "Turno mañana") para matricular y reportar en bloque. Cada persona
// pertenece a UNA cohorte a la vez (ver UserTenant.cohortId, schema.prisma)
// — no es una relacion muchos-a-muchos: para el caso de uso pedido
// ("agrupar alumnos"), una cohorte por persona alcanza y es mucho mas
// simple de mostrar/editar que membresias multiples.
// ============================================================================

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { AuditService } from '../../common/audit/audit.service';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';
import { AddCohortMemberDto } from './dto/add-cohort-member.dto';

@Injectable()
export class CohortService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly auditService: AuditService,
  ) {}

  async findAll() {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.cohort.findMany({
        include: { _count: { select: { members: true } } },
        orderBy: { name: 'asc' },
      }),
    );
  }

  async findOne(id: string) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, async (tx) => {
      const cohort = await tx.cohort.findUnique({
        where: { id },
        include: {
          members: {
            include: { user: true },
            orderBy: { user: { fullName: 'asc' } },
          },
        },
      });
      if (!cohort) {
        throw new NotFoundException(`No existe la cohorte "${id}".`);
      }
      return {
        id: cohort.id,
        name: cohort.name,
        description: cohort.description,
        createdAt: cohort.createdAt,
        members: cohort.members.map((m) => ({
          userTenantId: m.id,
          fullName: m.user.fullName,
          email: m.user.email,
        })),
      };
    });
  }

  async create(dto: CreateCohortDto, actorUserId?: string) {
    const tenantId = this.tenantContext.requireTenantId();
    // "cohorts" SI tiene Row-Level Security (ver rls-policies.sql) — a
    // diferencia de "tenants"/"tenant_domains", un INSERT directo sin pasar
    // por "withTenant" (que fija app.current_tenant) violaria la politica
    // "WITH CHECK" implicita y Postgres rechazaria la fila.
    const cohort = await this.prisma.withTenant(tenantId, (tx) =>
      tx.cohort.create({ data: { tenantId, name: dto.name, description: dto.description } }),
    );
    await this.auditService.record(tenantId, {
      userId: actorUserId,
      action: 'cohort.created',
      payload: { cohortId: cohort.id, name: cohort.name },
    });
    return cohort;
  }

  async update(id: string, dto: UpdateCohortDto) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, async (tx) => {
      const existing = await tx.cohort.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`No existe la cohorte "${id}".`);
      }
      return tx.cohort.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description || null }),
        },
      });
    });
  }

  async remove(id: string, actorUserId?: string) {
    const tenantId = this.tenantContext.requireTenantId();
    const deleted = await this.prisma.withTenant(tenantId, async (tx) => {
      const existing = await tx.cohort.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`No existe la cohorte "${id}".`);
      }
      // No hace falta "quitar" a los miembros a mano antes de borrar: la
      // relacion UserTenant.cohortId usa "onDelete: SetNull" (ver
      // schema.prisma) — Postgres los deja sin cohorte solo, en la misma
      // operacion.
      await tx.cohort.delete({ where: { id } });
      return existing;
    });
    await this.auditService.record(tenantId, {
      userId: actorUserId,
      action: 'cohort.deleted',
      payload: { cohortId: id, name: deleted.name },
    });
    return { deleted: true };
  }

  async addMember(cohortId: string, dto: AddCohortMemberDto) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, async (tx) => {
      const cohort = await tx.cohort.findUnique({ where: { id: cohortId } });
      if (!cohort) {
        throw new NotFoundException(`No existe la cohorte "${cohortId}".`);
      }
      const userTenant = await tx.userTenant.findUnique({ where: { id: dto.userTenantId } });
      if (!userTenant) {
        throw new NotFoundException(`No existe la membresía "${dto.userTenantId}" en esta institución.`);
      }
      if (userTenant.cohortId === cohortId) {
        throw new ConflictException('Esa persona ya pertenece a esta cohorte.');
      }
      await tx.userTenant.update({ where: { id: dto.userTenantId }, data: { cohortId } });
      return { added: true };
    });
  }

  async removeMember(cohortId: string, userTenantId: string) {
    const tenantId = this.tenantContext.requireTenantId();
    await this.prisma.withTenant(tenantId, async (tx) => {
      const userTenant = await tx.userTenant.findUnique({ where: { id: userTenantId } });
      if (!userTenant || userTenant.cohortId !== cohortId) {
        throw new NotFoundException('Esa persona no pertenece a esta cohorte.');
      }
      await tx.userTenant.update({ where: { id: userTenantId }, data: { cohortId: null } });
    });
    return { removed: true };
  }
}
