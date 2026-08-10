// ============================================================================
// report-preset.dto.ts — "Reportes personalizados" (plan Pro, ver
// lib/pricing.ts): guardar/generar una seleccion de columnas con nombre
// sobre uno de los 3 reportes que ya existen (ver REPORT_COLUMN_CATALOG en
// reports.service.ts, que valida que "reportType"/"columns" sean
// combinaciones reales — este DTO solo valida la FORMA del body).
// ============================================================================

import { ArrayMinSize, IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const REPORT_PRESET_TYPES = ['attendance', 'grades', 'enrollment_progress'] as const;

export class CreateReportPresetDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsIn(REPORT_PRESET_TYPES)
  reportType: (typeof REPORT_PRESET_TYPES)[number];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  columns: string[];
}

export class GenerateCustomReportFilterDto {
  @IsString()
  presetId: string;

  @IsOptional()
  @IsString()
  courseId?: string;
}
