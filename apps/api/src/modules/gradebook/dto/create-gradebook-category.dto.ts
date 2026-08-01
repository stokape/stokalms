// ============================================================================
// create-gradebook-category.dto.ts — Body de
// "POST /api/v1/courses/:courseId/gradebook-categories".
//
// Ver docs/architecture/04-flujos-criticos.md, seccion 4.2: cada categoria
// (ej. "Examenes", "Tareas") pesa un porcentaje de la nota final del curso,
// y puede descartar sus N notas mas bajas ("drop_lowest") antes de promediar.
// ============================================================================

import { IsInt, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateGradebookCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  // Porcentaje que esta categoria pesa en la nota final (0-100). La SUMA de
  // todas las categorias de un curso deberia dar 100, pero no se valida de
  // forma estricta aqui: mientras se arma el curso es normal ir creando
  // categorias de a una, sin que sumen 100 todavia — se puede seguir
  // ajustando hasta el dia de "publicar notas" (ver gradebook.service.ts).
  @IsNumber()
  @Min(0)
  @Max(100)
  weightPct: number;

  @IsInt()
  @Min(0)
  dropLowest: number = 0;
}
