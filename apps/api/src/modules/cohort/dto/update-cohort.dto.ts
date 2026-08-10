// ============================================================================
// update-cohort.dto.ts — Body de "PATCH /cohorts/:id". Ver cohort.service.ts.
// ============================================================================

import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCohortDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
