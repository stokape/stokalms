// ============================================================================
// create-course.dto.ts — Body de "POST /api/v1/courses".
// ============================================================================

import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCourseDto {
  // A que periodo academico pertenece este curso (ver docs/architecture/02-modelo-de-datos.md).
  @IsUUID()
  termId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  code: string; // Ej. "CONT-101".

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  // Opcional: si el tenant no especifica una escala, el curso queda sin
  // escala asignada hasta que alguien la configure (no se asume una por
  // defecto, para no calificar con una escala que nadie eligio a proposito).
  @IsOptional()
  @IsUUID()
  gradingScaleId?: string;
}
