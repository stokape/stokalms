// ============================================================================
// enrollment.controller.ts — Rutas HTTP de matricula, anidadas bajo la
// seccion ("/courses/:courseId/sections/:sectionId/enrollments"). Mismo
// motivo que section.controller.ts: PermissionsGuard necesita ":courseId"
// en la URL para evaluar permisos acotados a un curso especifico.
// ============================================================================

import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';

@Controller('courses/:courseId/sections/:sectionId/enrollments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @RequirePermission('enrollment', 'create')
  @Post()
  create(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: CreateEnrollmentDto,
  ) {
    return this.enrollmentService.create(courseId, sectionId, dto);
  }

  @RequirePermission('enrollment', 'view')
  @Get()
  findAll(@Param('courseId') courseId: string, @Param('sectionId') sectionId: string) {
    return this.enrollmentService.findAllBySection(courseId, sectionId);
  }

  // Cambiar el estado (ej. retirar -> "dropped") requiere el mismo permiso
  // que matricular ("enrollment:create" no aplica; se reutiliza
  // "enrollment:delete" del catalogo sembrado en prisma/seed.js, pensado
  // originalmente para "dar de baja" — semanticamente es la misma accion,
  // aunque tecnicamente se implemente como un PATCH y no un DELETE, ver la
  // nota en update-enrollment-status.dto.ts sobre por que nunca se borra).
  @RequirePermission('enrollment', 'delete')
  @Patch(':id')
  updateStatus(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEnrollmentStatusDto,
  ) {
    return this.enrollmentService.updateStatus(courseId, sectionId, id, dto);
  }
}
