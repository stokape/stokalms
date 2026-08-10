// ============================================================================
// attendance.controller.ts — Rutas HTTP de asistencia, anidadas bajo la
// sección (mismo motivo que enrollment.controller.ts: PermissionsGuard
// necesita ":courseId" en la URL para evaluar permisos acotados al curso).
// ============================================================================

import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

@Controller('courses/:courseId/sections/:sectionId/attendance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @RequirePermission('attendance', 'view')
  @Get()
  findBySectionAndDate(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Query('date') date: string,
  ) {
    return this.attendanceService.findBySectionAndDate(courseId, sectionId, date);
  }

  // Un solo permiso ("attendance:create") cubre marcar Y corregir: volver a
  // enviar la misma fecha es un upsert (ver attendance.service.ts, "mark"),
  // no una acción distinta que amerite pedir "attendance:edit" aparte.
  @RequirePermission('attendance', 'create')
  @Post()
  mark(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: MarkAttendanceDto,
  ) {
    return this.attendanceService.mark(courseId, sectionId, dto);
  }
}
