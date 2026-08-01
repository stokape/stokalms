// ============================================================================
// update-assessment.dto.ts — Body de "PATCH .../assessments/:id".
// El "type" no es editable: cambiar el tipo de una evaluacion despues de
// creada (y posiblemente ya con preguntas o entregas) no tiene un
// significado claro — se crea una evaluacion nueva en su lugar.
// ============================================================================

import { IsInt, IsNumber, IsObject, IsOptional, Min } from 'class-validator';

export class UpdateAssessmentDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPoints?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
