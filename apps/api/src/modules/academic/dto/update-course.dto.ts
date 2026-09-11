// ============================================================================
// update-course.dto.ts — Body de "PATCH /api/v1/courses/:id".
// ============================================================================

import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateCourseDto {
  // Permite asignar (o cambiar) el periodo academico de un curso que se
  // creo sin uno (ver create-course.dto.ts, termId opcional ahi).
  @IsOptional()
  @IsUUID()
  termId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsUUID()
  gradingScaleId?: string;

  @IsOptional()
  @IsUUID()
  certificateTemplateId?: string;
}
