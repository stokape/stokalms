// ============================================================================
// assessment.service.ts — CRUD de evaluaciones (examenes, tareas, foros,
// rubricas) dentro de un curso.
// ============================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';

@Injectable()
export class AssessmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(courseId: string, dto: CreateAssessmentDto) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, async (tx) => {
      const course = await tx.course.findUnique({ where: { id: courseId } });
      if (!course) {
        throw new NotFoundException(`No existe el curso "${courseId}".`);
      }

      // La categoria de gradebook debe pertenecer a ESTE mismo curso — sin
      // esta verificacion, se podria enlazar una evaluacion a la categoria
      // de ponderacion de OTRO curso (un dato sin sentido de negocio, y que
      // ademas rompería el calculo de la nota final, ver gradebook.service.ts).
      const category = await tx.gradebookCategory.findUnique({
        where: { id: dto.gradebookCategoryId },
      });
      if (!category || category.courseId !== courseId) {
        throw new NotFoundException(
          `No existe la categoria "${dto.gradebookCategoryId}" en el curso "${courseId}".`,
        );
      }

      return tx.assessment.create({
        data: {
          tenantId,
          courseId,
          gradebookCategoryId: dto.gradebookCategoryId,
          type: dto.type,
          maxPoints: dto.maxPoints,
          maxAttempts: dto.maxAttempts ?? 1,
          config: (dto.config ?? {}) as Prisma.InputJsonValue,
        },
      });
    });
  }

  async findAllByCourse(courseId: string) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.assessment.findMany({ where: { courseId }, orderBy: { id: 'asc' } }),
    );
  }

  async findOne(courseId: string, id: string) {
    const tenantId = this.tenantContext.requireTenantId();
    const assessment = await this.prisma.withTenant(tenantId, (tx) =>
      tx.assessment.findUnique({ where: { id } }),
    );
    if (!assessment || assessment.courseId !== courseId) {
      throw new NotFoundException(`No existe la evaluacion "${id}" en el curso "${courseId}".`);
    }
    return assessment;
  }

  async update(courseId: string, id: string, dto: UpdateAssessmentDto) {
    await this.findOne(courseId, id);
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.assessment.update({
        where: { id },
        data: {
          ...(dto.maxPoints !== undefined && { maxPoints: dto.maxPoints }),
          ...(dto.maxAttempts !== undefined && { maxAttempts: dto.maxAttempts }),
          ...(dto.config !== undefined && { config: dto.config as Prisma.InputJsonValue }),
        },
      }),
    );
  }

  async remove(courseId: string, id: string) {
    await this.findOne(courseId, id);
    const tenantId = this.tenantContext.requireTenantId();
    await this.prisma.withTenant(tenantId, (tx) => tx.assessment.delete({ where: { id } }));
    return { deleted: true };
  }
}
