// ============================================================================
// create-cohort.dto.ts — Body de "POST /cohorts". Ver cohort.service.ts.
// ============================================================================

import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCohortDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
