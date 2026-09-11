// ============================================================================
// create-course.dto.ts — Body de "POST /api/v1/courses".
// ============================================================================

import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCourseDto {
  // A que periodo academico pertenece este curso (ver docs/architecture/02-modelo-de-datos.md).
  // Opcional: una institucion sin ningun periodo creado todavia puede crear
  // su primer curso igual, y asignarle un periodo despues (ver
  // update-course.dto.ts) — antes esto bloqueaba por completo la pantalla
  // de "crear curso" hasta ir a crear un periodo primero.
  @IsOptional()
  @IsUUID()
  termId?: string;

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

  // Plantilla de certificado FIJA de este curso (ver la nota extensa en
  // schema.prisma, Course.certificateTemplateId) — opcional: sin ella, la
  // emision de certificados de este curso queda bloqueada hasta que se le
  // asigne una (ver certificate.service.ts, "issue").
  @IsOptional()
  @IsUUID()
  certificateTemplateId?: string;
}
