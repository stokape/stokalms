// ============================================================================
// create-module.dto.ts — Body de "POST /courses/:courseId/modules". El
// "courseId" va en la URL (ver module.controller.ts), no en el body.
// ============================================================================

import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  @IsNotEmpty()
  title: string; // Ej. "Módulo 1 - Introducción".

  // Orden de aparición dentro del curso (menor primero). Si no se manda, el
  // service lo calcula como "el último + 1" (ver module.service.ts).
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
