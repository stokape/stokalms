// ============================================================================
// update-question.dto.ts — Body de ".../questions/:id".
// ============================================================================

import { IsNumber, IsObject, IsOptional, Min } from 'class-validator';

export class UpdateQuestionDto {
  @IsOptional()
  @IsObject()
  body?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  correctAnswer?: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number;
}
