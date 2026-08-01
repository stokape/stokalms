// ============================================================================
// section.service.ts — Logica de negocio de las secciones (horarios/cupos
// dentro de un curso).
// ============================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class SectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(courseId: string, dto: CreateSectionDto) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const course = await tx.course.findUnique({ where: { id: courseId } });
      if (!course) {
        throw new NotFoundException(`No existe el curso "${courseId}".`);
      }

      return tx.section.create({
        data: {
          tenantId,
          courseId,
          name: dto.name,
          // Prisma tipa las columnas "Json" como "Prisma.InputJsonValue"
          // (una union que incluye arrays), no como un "Record<string,
          // unknown>" plano — el cast de abajo es seguro porque el DTO ya
          // valido, con @IsObject(), que "schedule" es un objeto JSON valido.
          schedule: (dto.schedule ?? {}) as Prisma.InputJsonValue,
          capacity: dto.capacity ?? 0,
        },
      });
    });
  }

  async findAllByCourse(courseId: string) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.section.findMany({ where: { courseId }, orderBy: { name: 'asc' } }),
    );
  }

  // "courseId" se recibe SIEMPRE junto al id de la seccion (ver las rutas
  // anidadas en section.controller.ts: /courses/:courseId/sections/:id) y
  // se verifica contra el dato real guardado. Esto cierra un hueco de
  // autorizacion sutil: PermissionsGuard concede o niega el permiso segun
  // el "courseId" que viene en la URL (ver permissions.guard.ts), pero sin
  // esta verificacion nada impediria que alguien con permiso sobre el curso
  // A intente operar, cambiando el id en la URL, sobre una seccion que en
  // realidad pertenece al curso B.
  async findOne(courseId: string, id: string) {
    const tenantId = this.tenantContext.requireTenantId();
    const section = await this.prisma.withTenant(tenantId, (tx) =>
      tx.section.findUnique({ where: { id } }),
    );
    if (!section || section.courseId !== courseId) {
      throw new NotFoundException(`No existe la seccion "${id}" en el curso "${courseId}".`);
    }
    return section;
  }

  async update(courseId: string, id: string, dto: UpdateSectionDto) {
    await this.findOne(courseId, id);
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.section.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.schedule !== undefined && {
            schedule: dto.schedule as Prisma.InputJsonValue,
          }),
          ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        },
      }),
    );
  }

  async remove(courseId: string, id: string) {
    await this.findOne(courseId, id);
    const tenantId = this.tenantContext.requireTenantId();
    await this.prisma.withTenant(tenantId, (tx) => tx.section.delete({ where: { id } }));
    return { deleted: true };
  }
}
