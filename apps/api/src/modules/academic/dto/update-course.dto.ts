// ============================================================================
// update-course.dto.ts — Body de "PATCH /api/v1/courses/:id".
// ============================================================================

import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateCourseDto {
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
