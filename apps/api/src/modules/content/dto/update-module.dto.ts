// ============================================================================
// update-module.dto.ts — Body de "PATCH /courses/:courseId/modules/:id".
// Todos los campos opcionales: un PATCH solo cambia lo que el cliente manda.
// ============================================================================

import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
