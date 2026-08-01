// ============================================================================
// grade-answer.dto.ts — Body de calificacion MANUAL de una respuesta
// (ver docs/architecture/04-flujos-criticos.md, seccion 4.2: preguntas de
// tipo "open" -respuesta abierta- las califica un docente, no el sistema).
// ============================================================================

import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class GradeAnswerDto {
  @IsNumber()
  @Min(0)
  score: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
