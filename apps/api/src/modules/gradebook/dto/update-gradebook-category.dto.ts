// ============================================================================
// update-gradebook-category.dto.ts — Body de
// "PATCH .../gradebook-categories/:id".
// ============================================================================

import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateGradebookCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weightPct?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  dropLowest?: number;
}
