// ============================================================================
// create-assessment.dto.ts — Body de
// "POST /api/v1/courses/:courseId/assessments".
// ============================================================================

import {
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateAssessmentDto {
  @IsIn(['exam', 'assignment', 'forum', 'rubric'])
  type: 'exam' | 'assignment' | 'forum' | 'rubric';

  @IsUUID()
  gradebookCategoryId: string;

  @IsNumber()
  @Min(0)
  maxPoints: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  // Configuracion especifica del tipo. Por ahora solo se usa
  // "autoPublish": si true, la nota de una entrega auto-calificable (ver
  // submission.service.ts) queda visible para el estudiante apenas se
  // corrige, sin esperar a "publicar notas" del curso completo (ver
  // docs/architecture/02-modelo-de-datos.md, ASSESSMENT.config).
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
