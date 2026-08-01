// ============================================================================
// grading-scale.service.ts — CRUD de escalas de notas (nivel tenant).
// Mismo patron ya establecido en term.service.ts (resolver tenant ->
// withTenant -> Prisma).
// ============================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CreateGradingScaleDto } from './dto/create-grading-scale.dto';
import { UpdateGradingScaleDto } from './dto/update-grading-scale.dto';

@Injectable()
export class GradingScaleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(dto: CreateGradingScaleDto) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.gradingScale.create({
        data: {
          tenantId,
          name: dto.name,
          type: dto.type,
          bands: (dto.bands ?? {}) as Prisma.InputJsonValue,
          decimalRounding: dto.decimalRounding ?? 0,
        },
      }),
    );
  }

  async findAll() {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.gradingScale.findMany({ orderBy: { name: 'asc' } }),
    );
  }

  async findOne(id: string) {
    const tenantId = this.tenantContext.requireTenantId();
    const scale = await this.prisma.withTenant(tenantId, (tx) =>
      tx.gradingScale.findUnique({ where: { id } }),
    );
    if (!scale) {
      throw new NotFoundException(`No existe la escala de notas "${id}".`);
    }
    return scale;
  }

  async update(id: string, dto: UpdateGradingScaleDto) {
    await this.findOne(id);
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.gradingScale.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.bands !== undefined && { bands: dto.bands as Prisma.InputJsonValue }),
          ...(dto.decimalRounding !== undefined && { decimalRounding: dto.decimalRounding }),
        },
      }),
    );
  }

  async remove(id: string) {
    await this.findOne(id);
    const tenantId = this.tenantContext.requireTenantId();
    await this.prisma.withTenant(tenantId, (tx) => tx.gradingScale.delete({ where: { id } }));
    return { deleted: true };
  }
}
