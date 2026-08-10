// ============================================================================
// report-filter.dto.ts — Query params comunes a los reportes de
// reports.controller.ts. "courseId" es opcional en asistencia/avance
// (sin el, el reporte es de TODO el tenant) y obligatorio en notas (la
// nota final se calcula curso por curso, ver computeCourseGrades en
// gradebook.service.ts — no existe una "escala de notas del tenant"
// unica contra la que promediar entre cursos distintos).
// ============================================================================

import { IsOptional, IsString } from 'class-validator';

export class ReportFilterDto {
  @IsOptional()
  @IsString()
  courseId?: string;
}

export class CourseReportFilterDto {
  @IsString()
  courseId: string;
}

// "GET /reports/analytics/trend" — mismo "courseId" opcional que
// ReportFilterDto, mas cuantos meses hacia atras mostrar (ver
// reports.service.ts, "getCompletionTrend"). DTO propio (no una
// interseccion de tipos inline en el controller) para que ValidationPipe
// (whitelist + forbidNonWhitelisted, ver main.ts) sepa exactamente que
// campos son validos en este query.
export class CompletionTrendFilterDto {
  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  months?: string;
}
