// ============================================================================
// update-section.dto.ts — Body de "PATCH /api/v1/sections/:id".
// ============================================================================

import { IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  schedule?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;
}
