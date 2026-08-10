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
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.service';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import { BulkEnrollDto } from './dto/bulk-enroll.dto';
import { ImportHistoricalEnrollmentsDto } from './dto/import-historical-enrollments.dto';

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

  @RequirePermission('enrollment', 'bulk_import')
  @Post('bulk')
  bulkCreate(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: BulkEnrollDto,
  ) {
    return this.enrollmentService.bulkCreate(courseId, sectionId, dto);
  }

  // "Migracion de informacion" (plan Enterprise): traer un roster
  // historico de otro sistema, con estado/fecha ya definidos (ver
  // enrollment.service.ts, "importHistorical"). Mismo permiso que la
  // matricula masiva de gente NUEVA ("bulk"): es la misma audiencia
  // (Coordinador academico/Administrador), la diferencia es de intencion,
  // no de quien puede hacerlo.
  @RequirePermission('enrollment', 'bulk_import')
  @Post('import-historical')
  importHistorical(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: ImportHistoricalEnrollmentsDto,
  ) {
    return this.enrollmentService.importHistorical(courseId, sectionId, dto, user.userId);
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
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEnrollmentStatusDto,
  ) {
    return this.enrollmentService.updateStatus(courseId, sectionId, id, dto, user.userId);
  }
}
