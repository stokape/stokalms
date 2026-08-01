// ============================================================================
// create-grading-scale.dto.ts — Body de "POST /api/v1/grading-scales".
//
// Una escala de notas es configuracion de TENANT (no de curso): cada
// institucion define las suyas una vez y despues las reutiliza en varios
// cursos (ver Course.gradingScaleId en schema.prisma, y
// docs/guia-para-no-tecnicos.md, seccion 4.2, ejemplo Instituto San Martin
// -vigesimal- vs Academia TechFuturo -centesimal-).
// ============================================================================

import { IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateGradingScaleDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Ej. "Escala vigesimal estandar".

  @IsIn(['vigesimal', 'centesimal', 'literal'])
  type: 'vigesimal' | 'centesimal' | 'literal';

  // Bandas de conversion de porcentaje a letra, SOLO relevantes para
  // type="literal" (ej. {"90-100":"A","80-89":"B",...} — ver
  // gradebook.service.ts, metodo "applyScale", para como se leen).
  @IsOptional()
  @IsObject()
  bands?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  decimalRounding?: number;
}
