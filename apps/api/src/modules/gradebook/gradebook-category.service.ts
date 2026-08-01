// ============================================================================
// gradebook-category.service.ts — CRUD de categorias de calificacion
// (ej. "Examenes 50%", "Tareas 30%") dentro de un curso.
//
// Sigue el mismo patron de verificacion cruzada que section.service.ts:
// cada operacion confirma que la categoria realmente pertenece al
// "courseId" recibido en la URL, para que un permiso valido sobre OTRO
// curso no alcance para tocar categorias de este.
// ============================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CreateGradebookCategoryDto } from './dto/create-gradebook-category.dto';
import { UpdateGradebookCategoryDto } from './dto/update-gradebook-category.dto';

@Injectable()
export class GradebookCategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(courseId: string, dto: CreateGradebookCategoryDto) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, async (tx) => {
      const course = await tx.course.findUnique({ where: { id: courseId } });
      if (!course) {
        throw new NotFoundException(`No existe el curso "${courseId}".`);
      }
      return tx.gradebookCategory.create({
        data: {
          tenantId,
          courseId,
          name: dto.name,
          weightPct: dto.weightPct,
          dropLowest: dto.dropLowest ?? 0,
        },
      });
    });
  }

  async findAllByCourse(courseId: string) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.gradebookCategory.findMany({ where: { courseId }, orderBy: { name: 'asc' } }),
    );
  }

  async findOne(courseId: string, id: string) {
    const tenantId = this.tenantContext.requireTenantId();
    const category = await this.prisma.withTenant(tenantId, (tx) =>
      tx.gradebookCategory.findUnique({ where: { id } }),
    );
    if (!category || category.courseId !== courseId) {
      throw new NotFoundException(`No existe la categoria "${id}" en el curso "${courseId}".`);
    }
    return category;
  }

  async update(courseId: string, id: string, dto: UpdateGradebookCategoryDto) {
    await this.findOne(courseId, id);
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.gradebookCategory.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.weightPct !== undefined && { weightPct: dto.weightPct }),
          ...(dto.dropLowest !== undefined && { dropLowest: dto.dropLowest }),
        },
      }),
    );
  }

  async remove(courseId: string, id: string) {
    await this.findOne(courseId, id);
    const tenantId = this.tenantContext.requireTenantId();
    await this.prisma.withTenant(tenantId, (tx) => tx.gradebookCategory.delete({ where: { id } }));
    return { deleted: true };
  }
}
