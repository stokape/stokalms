// ============================================================================
// course.service.ts — Logica de negocio de los cursos.
//
// Mismo patron que term.service.ts (resolver tenant -> withTenant -> Prisma).
// La unica diferencia relevante es "create": ademas de crear el curso,
// valida que el "termId" recibido pertenezca REALMENTE a este tenant antes
// de usarlo — sin esa validacion, alguien podria intentar enlazar un curso a
// un termId de OTRO tenant adivinando su UUID (poco probable, pero gratis de
// prevenir: la consulta ya pasa por Row-Level Security, asi que un termId
// ajeno simplemente no aparece y el create falla con NotFoundException).
// ============================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(dto: CreateCourseDto) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const term = await tx.term.findUnique({ where: { id: dto.termId } });
      if (!term) {
        throw new NotFoundException(`No existe el periodo academico "${dto.termId}".`);
      }

      return tx.course.create({
        data: {
          tenantId,
          termId: dto.termId,
          code: dto.code,
          title: dto.title,
          gradingScaleId: dto.gradingScaleId,
          certificateTemplateId: dto.certificateTemplateId,
        },
      });
    });
  }

  async findAll(termId?: string) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.course.findMany({
        // El filtro opcional "?termId=..." (ver course.controller.ts) sirve
        // para pantallas tipo "cursos de este periodo" sin traer todo el
        // historico de la institucion de una vez.
        where: termId ? { termId } : undefined,
        orderBy: { code: 'asc' },
      }),
    );
  }

  async findOne(id: string) {
    const tenantId = this.tenantContext.requireTenantId();
    const course = await this.prisma.withTenant(tenantId, (tx) =>
      tx.course.findUnique({ where: { id } }),
    );
    if (!course) {
      throw new NotFoundException(`No existe el curso "${id}".`);
    }
    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    await this.findOne(id);
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.course.update({
        where: { id },
        data: {
          ...(dto.code !== undefined && { code: dto.code }),
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.gradingScaleId !== undefined && { gradingScaleId: dto.gradingScaleId }),
          ...(dto.certificateTemplateId !== undefined && {
            certificateTemplateId: dto.certificateTemplateId,
          }),
        },
      }),
    );
  }

  async remove(id: string) {
    await this.findOne(id);
    const tenantId = this.tenantContext.requireTenantId();
    await this.prisma.withTenant(tenantId, (tx) => tx.course.delete({ where: { id } }));
    return { deleted: true };
  }
}
