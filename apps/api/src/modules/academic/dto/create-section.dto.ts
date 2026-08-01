// ============================================================================
// create-section.dto.ts — Body de "POST /api/v1/courses/:courseId/sections".
// El "courseId" va en la URL (ver section.controller.ts), no en el body: es
// el propio recurso padre en la ruta REST, no un dato que el cliente elija.
// ============================================================================

import { IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Ej. "Seccion A - Turno Mañana".

  // Horario en JSON libre (dias, horas, aula) — ver docs/architecture/02-modelo-de-datos.md,
  // seccion 2.2: cada institucion arma sus horarios de forma distinta, por
  // eso no se modela como columnas fijas.
  @IsOptional()
  @IsObject()
  schedule?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;
}
