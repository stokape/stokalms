// ============================================================================
// platform-tenants.service.ts — Panel de administracion de PLATAFORMA sobre
// CUALQUIER institucion: activar/desactivar, dominios, roles y miembros.
//
// EN QUE SE DIFERENCIA de tenant.service.ts / tenant-domain.service.ts /
// user.service.ts (self-service, siempre sobre "el tenant activo del
// request", ver tenantContext.requireTenantId()): aca "tenantId" SIEMPRE
// llega como parametro explicito, tomado de la URL (ver
// platform-tenants.controller.ts), porque quien llama (un Administrador de
// PLATAFORMA, ver PlatformAdminGuard) no es miembro de la institucion que
// esta administrando. Es, a proposito, una version "cross-tenant" de esas
// mismas operaciones — se acepta cierta duplicacion de logica con esos
// servicios para mantener cada uno simple de leer y auditar por separado
// (mismo criterio ya usado entre tenant-registration.service.ts y el resto).
//
// Tablas con Row-Level Security (roles, user_roles, user_tenants — ver
// rls-policies.sql) se consultan con "prisma.withTenant(tenantId, ...)"
// para que la politica de esa tabla deje pasar filas de la institucion
// pedida aunque quien llama no tenga membresia en ella. "tenants" y
// "tenant_domains" NO tienen RLS (son datos DE la plataforma), asi que ahi
// alcanza con filtrar a mano por tenantId.
// ============================================================================

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { resolveTxt } from 'node:dns/promises';
import { PrismaService } from '../../prisma/prisma.service';
import { CasbinService } from '../../rbac/casbin.service';
import { CreateTenantDomainDto } from '../tenant-domain/dto/create-tenant-domain.dto';
import { AssignRoleDto } from '../user-management/dto/assign-role.dto';
import { TenantService } from '../tenant/tenant.service';
import { UpdateTenantDto } from '../tenant/dto/update-tenant.dto';
import { SetTenantStatusDto } from './dto/set-tenant-status.dto';
import { SetTenantPlanDto } from './dto/set-tenant-plan.dto';

const TXT_PREFIX = 'stoka-verify=';

@Injectable()
export class PlatformTenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly casbin: CasbinService,
    // Ver la nota extensa en tenant.service.ts: sus metodos
    // "ParaTenant(tenantId, ...)" son la MISMA logica que usa el
    // autoservicio de cada institucion (logo/fondo/favicon/color/
    // mantenimiento), solo que aca "tenantId" viene de la URL en vez de
    // "tenantContext.requireTenantId()".
    private readonly tenantService: TenantService,
  ) {}

  // --- Marca (logo, fondo, favicon, color, mantenimiento) ---------------

  async getBranding(tenantId: string) {
    return this.tenantService.getBrandingForTenant(tenantId);
  }

  async updateBranding(tenantId: string, dto: UpdateTenantDto) {
    return this.tenantService.updateForTenant(tenantId, dto);
  }

  async updateLogo(tenantId: string, file: { originalname: string; mimetype: string; buffer: Buffer }) {
    return this.tenantService.updateBrandingImageForTenant(tenantId, 'logoKey', file);
  }

  async updateBackgroundImage(
    tenantId: string,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ) {
    return this.tenantService.updateBrandingImageForTenant(tenantId, 'backgroundImageKey', file);
  }

  async updateFavicon(tenantId: string, file: { originalname: string; mimetype: string; buffer: Buffer }) {
    return this.tenantService.updateBrandingImageForTenant(tenantId, 'faviconKey', file);
  }

  async updateMaintenanceImage(
    tenantId: string,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ) {
    return this.tenantService.updateBrandingImageForTenant(tenantId, 'maintenanceImageKey', file);
  }

  async removeMaintenanceImage(tenantId: string) {
    return this.tenantService.removeMaintenanceImageForTenant(tenantId);
  }

  // --- Listado + activar/desactivar ------------------------------------

  async findAll() {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        domains: { select: { domain: true, isPrimary: true, verified: true } },
        // "_count" evita traer TODAS las filas de userMemberships solo para
        // contarlas — Prisma arma un COUNT(*) en SQL en vez de traer datos
        // que despues se descartan.
        _count: { select: { userMemberships: true } },
      },
    });

    return tenants.map((t) => ({
      id: t.id,
      name: t.name,
      plan: t.plan,
      active: t.active,
      maintenanceMode: t.maintenanceMode,
      createdAt: t.createdAt,
      memberCount: t._count.userMemberships,
      primaryDomain: t.domains.find((d) => d.isPrimary)?.domain ?? t.domains[0]?.domain ?? null,
      domainCount: t.domains.length,
    }));
  }

  private async requireTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException(`No existe la institución "${tenantId}".`);
    }
    return tenant;
  }

  async setStatus(tenantId: string, dto: SetTenantStatusDto) {
    await this.requireTenant(tenantId);
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { active: dto.active },
    });
    return { id: tenant.id, active: tenant.active };
  }

  // Solo un Administrador de plataforma llega aca (PlatformAdminGuard a
  // nivel de controller) — ninguna institucion puede autoasignarse un plan
  // mejor desde tenant.service.ts (ver update-tenant.dto.ts, que a
  // proposito no tiene "plan"). "plan" hoy es solo informativo (ningun
  // guard/feature-flag lo lee todavia, ver tenant_features para el
  // mecanismo real de features por tenant) — fijarlo aca es el primer paso
  // para que, el dia que se conecte a un gate real, ya haya de donde leerlo.
  async setPlan(tenantId: string, dto: SetTenantPlanDto) {
    await this.requireTenant(tenantId);
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { plan: dto.plan },
    });
    return { id: tenant.id, plan: tenant.plan };
  }

  // --- Dominios (mismo flujo de verificacion TXT que tenant-domain.service.ts) ---

  async listDomains(tenantId: string) {
    await this.requireTenant(tenantId);
    return this.prisma.tenantDomain.findMany({
      where: { tenantId },
      select: { id: true, domain: true, isPrimary: true, verified: true, verificationToken: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addDomain(tenantId: string, dto: CreateTenantDomainDto) {
    await this.requireTenant(tenantId);

    const existing = await this.prisma.tenantDomain.findUnique({ where: { domain: dto.domain } });
    if (existing) {
      throw new ConflictException(`El dominio "${dto.domain}" ya está en uso.`);
    }

    const verificationToken = randomBytes(24).toString('hex');
    const created = await this.prisma.tenantDomain.create({
      data: { tenantId, domain: dto.domain, isPrimary: false, verified: false, verificationToken },
    });

    return {
      ...created,
      txtRecordName: `_stoka-verify.${created.domain}`,
      txtRecordValue: `${TXT_PREFIX}${verificationToken}`,
    };
  }

  async verifyDomain(tenantId: string, domainId: string) {
    const tenantDomain = await this.findDomainOrThrow(tenantId, domainId);
    if (tenantDomain.verified) {
      return tenantDomain;
    }
    if (!tenantDomain.verificationToken) {
      throw new ConflictException('Este dominio no tiene un token de verificación pendiente.');
    }

    const recordName = `_stoka-verify.${tenantDomain.domain}`;
    const expected = `${TXT_PREFIX}${tenantDomain.verificationToken}`;

    let found = false;
    try {
      const records = await resolveTxt(recordName);
      found = records.some((chunks) => chunks.join('').trim() === expected);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code !== 'ENOTFOUND' && code !== 'ENODATA') {
        throw err;
      }
    }

    if (!found) {
      throw new ConflictException(
        `Todavía no se encontró el registro TXT esperado en "${recordName}". Los cambios de DNS pueden tardar varios minutos (a veces horas) en propagarse.`,
      );
    }

    return this.prisma.tenantDomain.update({
      where: { id: domainId },
      data: { verified: true, verificationToken: null },
    });
  }

  async removeDomain(tenantId: string, domainId: string) {
    const tenantDomain = await this.findDomainOrThrow(tenantId, domainId);
    if (tenantDomain.isPrimary) {
      throw new ConflictException(
        'No se puede eliminar el dominio principal de una institución — es el único con el que su gente puede entrar.',
      );
    }
    await this.prisma.tenantDomain.delete({ where: { id: domainId } });
    return { ok: true };
  }

  private async findDomainOrThrow(tenantId: string, domainId: string) {
    const tenantDomain = await this.prisma.tenantDomain.findUnique({ where: { id: domainId } });
    if (!tenantDomain || tenantDomain.tenantId !== tenantId) {
      throw new NotFoundException('Dominio no encontrado.');
    }
    return tenantDomain;
  }

  // --- Miembros y roles (misma logica que user.service.ts, tenant explicito) ---

  async listMembers(tenantId: string) {
    await this.requireTenant(tenantId);
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

  async listAssignableRoles(tenantId: string) {
    await this.requireTenant(tenantId);
    return this.prisma.role.findMany({
      where: { OR: [{ tenantId: null }, { tenantId }] },
      orderBy: { name: 'asc' },
    });
  }

  async assignRole(tenantId: string, userTenantId: string, dto: AssignRoleDto) {
    await this.requireTenant(tenantId);

    await this.prisma.withTenant(tenantId, async (tx) => {
      const userTenant = await tx.userTenant.findUnique({ where: { id: userTenantId } });
      if (!userTenant) {
        throw new NotFoundException(`No existe la membresía "${userTenantId}" en esa institución.`);
      }

      const role = await tx.role.findUnique({ where: { id: dto.roleId } });
      if (!role || (role.tenantId !== null && role.tenantId !== tenantId)) {
        throw new NotFoundException(`No existe el rol "${dto.roleId}" disponible para esa institución.`);
      }

      if (dto.scopeCourseId) {
        const course = await tx.course.findUnique({ where: { id: dto.scopeCourseId } });
        if (!course) {
          throw new NotFoundException(`No existe el curso "${dto.scopeCourseId}" en esa institución.`);
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

    await this.casbin.reload();
    return { assigned: true };
  }

  async removeRole(tenantId: string, userTenantId: string, userRoleId: string) {
    await this.requireTenant(tenantId);

    await this.prisma.withTenant(tenantId, async (tx) => {
      const userRole = await tx.userRole.findUnique({ where: { id: userRoleId } });
      if (!userRole || userRole.userTenantId !== userTenantId) {
        throw new NotFoundException(`No existe la asignación "${userRoleId}" para esa persona.`);
      }
      await tx.userRole.delete({ where: { id: userRoleId } });
    });

    await this.casbin.reload();
    return { removed: true };
  }
}
