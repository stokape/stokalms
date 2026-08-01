// ============================================================================
// update-grading-scale.dto.ts — Body de "PATCH /api/v1/grading-scales/:id".
// ============================================================================

import { IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateGradingScaleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  bands?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  decimalRounding?: number;
}
