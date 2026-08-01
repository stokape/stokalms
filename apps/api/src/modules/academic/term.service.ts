// ============================================================================
// term.service.ts — Logica de negocio de los periodos academicos (Term).
//
// Es el primer servicio de un modulo de NEGOCIO real (a diferencia de
// health/auth/rbac, que son infraestructura). El patron que sigue aqui
// (resolver tenantId -> withTenant -> operacion Prisma) es el mismo que
// van a repetir TODOS los servicios de negocio futuros (Course, Section,
// Enrollment...) — por eso esta esta comentado con mas detalle que los
// que vengan despues.
// ============================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';

@Injectable()
export class TermService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(dto: CreateTermDto) {
    // "requireTenantId()" (ver tenant-context.service.ts) lanza un error
    // claro si, por algun motivo, este request no tiene un tenant resuelto
    // — no deberia poder pasar nunca en la practica porque PermissionsGuard
    // ya exige un usuario autenticado (y por tanto un tenant) antes de
    // llegar aqui, pero es una salvaguarda barata contra un bug futuro.
    const tenantId = this.tenantContext.requireTenantId();

    // TODA escritura de negocio pasa por withTenant(...): esto fija
    // "app.current_tenant" en la transaccion (ver prisma.service.ts), que es
    // lo que hace que la politica de Row-Level Security de la tabla
    // "terms" (ver rls-policies.sql) permita esta insercion.
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.term.create({
        data: {
          tenantId,
          name: dto.name,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
        },
      }),
    );
  }

  async findAll() {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.term.findMany({ orderBy: { startDate: 'desc' } }),
    );
  }

  async findOne(id: string) {
    const tenantId = this.tenantContext.requireTenantId();
    const term = await this.prisma.withTenant(tenantId, (tx) =>
      tx.term.findUnique({ where: { id } }),
    );

    // Nota de seguridad: si "id" perteneciera a OTRO tenant, la politica
    // RLS ya lo habria filtrado de la consulta de arriba (devolviendo
    // null), asi que este 404 cubre AMBOS casos (no existe / es de otro
    // tenant) sin distinguirlos — exactamente lo deseado: no revelar ni
    // siquiera que un ID de otro tenant existe.
    if (!term) {
      throw new NotFoundException(`No existe el periodo academico "${id}".`);
    }
    return term;
  }

  async update(id: string, dto: UpdateTermDto) {
    await this.findOne(id); // Reutiliza la validacion de existencia + tenant.
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.term.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
          ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        },
      }),
    );
  }

  async remove(id: string) {
    await this.findOne(id);
    const tenantId = this.tenantContext.requireTenantId();
    await this.prisma.withTenant(tenantId, (tx) => tx.term.delete({ where: { id } }));
    return { deleted: true };
  }
}
