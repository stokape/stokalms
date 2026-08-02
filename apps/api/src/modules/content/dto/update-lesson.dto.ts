// ============================================================================
// update-lesson.dto.ts — Body de "PATCH .../modules/:moduleId/lessons/:id".
// ============================================================================

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
