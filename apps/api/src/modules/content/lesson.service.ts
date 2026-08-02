// ============================================================================
// lesson.service.ts — Lógica de negocio de las Lecciones dentro de un
// Módulo. Mismo patrón que module.service.ts, un nivel más abajo: valida
// que el módulo padre exista Y pertenezca al curso de la URL antes de tocar
// nada (ver la nota extensa en module.service.ts, findOne).
// ============================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  // Reutilizado por ResourceService (necesita confirmar que la lección
  // padre existe y pertenece al módulo/curso de la URL antes de adjuntarle
  // un archivo) — ver resource.service.ts.
  async findOne(courseId: string, moduleId: string, id: string) {
    const tenantId = this.tenantContext.requireTenantId();
    const lesson = await this.prisma.withTenant(tenantId, (tx) =>
      tx.lesson.findUnique({ where: { id }, include: { module: true } }),
    );
    if (!lesson || lesson.moduleId !== moduleId || lesson.module.courseId !== courseId) {
      throw new NotFoundException(`No existe la lección "${id}" en ese módulo/curso.`);
    }
    const { module: _module, ...lessonWithoutModule } = lesson;
    return lessonWithoutModule;
  }

  async create(courseId: string, moduleId: string, dto: CreateLessonDto) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const module = await tx.module.findUnique({ where: { id: moduleId } });
      if (!module || module.courseId !== courseId) {
        throw new NotFoundException(`No existe el módulo "${moduleId}" en el curso "${courseId}".`);
      }

      return tx.lesson.create({
        data: { tenantId, moduleId, title: dto.title, content: dto.content ?? '' },
      });
    });
  }

  async findAllByModule(courseId: string, moduleId: string) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, async (tx) => {
      const module = await tx.module.findUnique({ where: { id: moduleId } });
      if (!module || module.courseId !== courseId) {
        throw new NotFoundException(`No existe el módulo "${moduleId}" en el curso "${courseId}".`);
      }
      return tx.lesson.findMany({ where: { moduleId }, orderBy: { title: 'asc' } });
    });
  }

  async update(courseId: string, moduleId: string, id: string, dto: UpdateLessonDto) {
    await this.findOne(courseId, moduleId, id);
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.lesson.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.content !== undefined && { content: dto.content }),
        },
      }),
    );
  }

  async remove(courseId: string, moduleId: string, id: string) {
    await this.findOne(courseId, moduleId, id);
    const tenantId = this.tenantContext.requireTenantId();
    await this.prisma.withTenant(tenantId, (tx) => tx.lesson.delete({ where: { id } }));
    return { deleted: true };
  }
}
