// ============================================================================
// reports.controller.ts — Rutas de "report:view" (JSON, para pintar la
// pantalla) y "report:export" (CSV, descarga directa) — dos permisos
// DISTINTOS por ruta (no un query param "?format=csv" sobre la misma ruta
// con el mismo permiso): asi cada endpoint declara con "@RequirePermission"
// exactamente lo que necesita, mismo criterio declarativo que el resto del
// backend, en vez de chequear el permiso a mano dentro del handler segun
// que pidieron.
// ============================================================================

import { Body, Controller, Delete, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { sendCsv } from '../../common/csv/csv.util';
import { ReportsService } from './reports.service';
import { ReportFilterDto, CourseReportFilterDto, CompletionTrendFilterDto } from './dto/report-filter.dto';
import { CohortComparisonFilterDto } from './dto/cohort-comparison-filter.dto';
import { CreateReportPresetDto, GenerateCustomReportFilterDto } from './dto/report-preset.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @RequirePermission('report', 'view')
  @Get('attendance')
  getAttendance(@Query() query: ReportFilterDto) {
    return this.reportsService.getAttendanceReport(query.courseId);
  }

  @RequirePermission('report', 'export')
  @Get('attendance/export')
  async exportAttendance(@Query() query: ReportFilterDto, @Res() res: Response) {
    const csv = await this.reportsService.getAttendanceReportCsv(query.courseId);
    sendCsv(res, csv, 'reporte-asistencia.csv');
  }

  @RequirePermission('report', 'view')
  @Get('grades')
  getGrades(@Query() query: CourseReportFilterDto) {
    return this.reportsService.getGradesReport(query.courseId);
  }

  @RequirePermission('report', 'export')
  @Get('grades/export')
  async exportGrades(@Query() query: CourseReportFilterDto, @Res() res: Response) {
    const csv = await this.reportsService.getGradesReportCsv(query.courseId);
    sendCsv(res, csv, 'reporte-notas.csv');
  }

  @RequirePermission('report', 'view')
  @Get('enrollment-progress')
  getEnrollmentProgress(@Query() query: ReportFilterDto) {
    return this.reportsService.getEnrollmentProgressReport(query.courseId);
  }

  @RequirePermission('report', 'export')
  @Get('enrollment-progress/export')
  async exportEnrollmentProgress(@Query() query: ReportFilterDto, @Res() res: Response) {
    const csv = await this.reportsService.getEnrollmentProgressReportCsv(query.courseId);
    sendCsv(res, csv, 'reporte-avance-matricula.csv');
  }

  // --- Analítica avanzada (plan Pro) ---------------------------------------

  @RequirePermission('report', 'view')
  @Get('analytics/trend')
  getCompletionTrend(@Query() query: CompletionTrendFilterDto) {
    return this.reportsService.getCompletionTrend(query.courseId, query.months ? Number(query.months) : undefined);
  }

  @RequirePermission('report', 'view')
  @Get('analytics/at-risk')
  getAtRiskStudents(@Query() query: ReportFilterDto) {
    return this.reportsService.getAtRiskStudents(query.courseId);
  }

  @RequirePermission('report', 'view')
  @Get('analytics/cohort-comparison')
  compareCohorts(@Query() query: CohortComparisonFilterDto) {
    return this.reportsService.compareCohorts(query.cohortAId, query.cohortBId, query.courseId);
  }

  // --- "Analítica empresarial": exportación cruda para BI (plan Enterprise) ---

  @RequirePermission('report', 'export')
  @Get('raw-export/enrollments')
  async exportRawEnrollments(@Query() query: ReportFilterDto, @Res() res: Response) {
    const csv = await this.reportsService.getRawEnrollmentsCsv(query.courseId);
    sendCsv(res, csv, 'export-matriculas.csv');
  }

  @RequirePermission('report', 'export')
  @Get('raw-export/submissions')
  async exportRawSubmissions(@Query() query: ReportFilterDto, @Res() res: Response) {
    const csv = await this.reportsService.getRawSubmissionsCsv(query.courseId);
    sendCsv(res, csv, 'export-entregas.csv');
  }

  @RequirePermission('report', 'export')
  @Get('raw-export/lesson-views')
  async exportRawLessonViews(@Query() query: ReportFilterDto, @Res() res: Response) {
    const csv = await this.reportsService.getRawLessonViewsCsv(query.courseId);
    sendCsv(res, csv, 'export-vistas-leccion.csv');
  }

  // --- Reportes personalizados (plan Pro) ----------------------------------

  @RequirePermission('report', 'view')
  @Get('presets')
  listPresets() {
    return this.reportsService.listPresets();
  }

  @RequirePermission('report', 'view')
  @Post('presets')
  createPreset(@Body() dto: CreateReportPresetDto) {
    return this.reportsService.createPreset(dto);
  }

  @RequirePermission('report', 'view')
  @Delete('presets/:id')
  deletePreset(@Param('id') id: string) {
    return this.reportsService.deletePreset(id);
  }

  @RequirePermission('report', 'view')
  @Get('custom')
  generateCustomReport(@Query() query: GenerateCustomReportFilterDto) {
    return this.reportsService.generateCustomReport(query.presetId, query.courseId);
  }

  @RequirePermission('report', 'export')
  @Get('custom/export')
  async exportCustomReport(@Query() query: GenerateCustomReportFilterDto, @Res() res: Response) {
    const csv = await this.reportsService.generateCustomReportCsv(query.presetId, query.courseId);
    sendCsv(res, csv, 'reporte-personalizado.csv');
  }
}
