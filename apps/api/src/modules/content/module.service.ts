// ============================================================================
// module.service.ts — Lógica de negocio de los Módulos de un curso (el
// primer nivel de "contenido": Course > Module > Lesson > Resource, ver
// schema.prisma). Mismo patrón que section.service.ts: resolver tenant ->
// withTenant -> Prisma, validando siempre que el padre (courseId) exista.
// ============================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Injectable()
export class ModuleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(courseId: string, dto: CreateModuleDto) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const course = await tx.course.findUnique({ where: { id: courseId } });
      if (!course) {
        throw new NotFoundException(`No existe el curso "${courseId}".`);
      }

      // Si no se especifica un orden, el módulo nuevo va al final de la
      // lista (evita que dos módulos terminen con el mismo "order" a menos
      // que el docente lo pida explícitamente).
      let order = dto.order;
      if (order === undefined) {
        const last = await tx.module.findFirst({
          where: { courseId },
          orderBy: { order: 'desc' },
        });
        order = (last?.order ?? -1) + 1;
      }

      return tx.module.create({
        data: { tenantId, courseId, title: dto.title, order },
      });
    });
  }

  async findAllByCourse(courseId: string) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.module.findMany({ where: { courseId }, orderBy: { order: 'asc' } }),
    );
  }

  // Ver el comentario extenso en section.service.ts (findOne): comprobar
  // "courseId" cierra el hueco de que alguien con permiso sobre el curso A
  // opere, cambiando el id en la URL, sobre un módulo que en realidad
  // pertenece al curso B.
  async findOne(courseId: string, id: string) {
    const tenantId = this.tenantContext.requireTenantId();
    const module = await this.prisma.withTenant(tenantId, (tx) =>
      tx.module.findUnique({ where: { id } }),
    );
    if (!module || module.courseId !== courseId) {
      throw new NotFoundException(`No existe el módulo "${id}" en el curso "${courseId}".`);
    }
    return module;
  }

  async update(courseId: string, id: string, dto: UpdateModuleDto) {
    await this.findOne(courseId, id);
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.module.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.order !== undefined && { order: dto.order }),
        },
      }),
    );
  }

  async remove(courseId: string, id: string) {
    await this.findOne(courseId, id);
    const tenantId = this.tenantContext.requireTenantId();
    await this.prisma.withTenant(tenantId, (tx) => tx.module.delete({ where: { id } }));
    return { deleted: true };
  }
}
