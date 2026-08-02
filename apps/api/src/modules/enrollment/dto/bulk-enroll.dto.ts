// ============================================================================
// bulk-enroll.dto.ts — Body de
// "POST /courses/:courseId/sections/:sectionId/enrollments/bulk".
//
// Cada fila es EXACTAMENTE lo mismo que CreateEnrollmentDto (email +
// nombre opcional) — el frontend arma este arreglo a partir de un CSV que
// la institucion sube (ver cursos/.../matricula-masiva/actions.ts), pero
// el backend nunca ve el archivo en si, solo filas ya parseadas: parsear
// CSV es un detalle de presentacion, no de negocio.
// ============================================================================

import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class BulkEnrollRowDto {
  // A PROPOSITO no usa "@IsEmail()" (a diferencia de create-enrollment.dto.ts):
  // ahi un formato invalido rechaza TODO el request antes de llegar al
  // servicio (ver main.ts, ValidationPipe con "forbidNonWhitelisted"), lo
  // cual arruinaria el proposito de una carga masiva — una sola fila con un
  // typo no deberia bloquear las demas filas validas de un CSV de 50
  // estudiantes. El formato se valida a mano, FILA POR FILA, dentro de
  // enrollment.service.ts (bulkCreate), donde un email invalido se reporta
  // como una fila mas con error en vez de tumbar el request entero.
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;
}

export class BulkEnrollDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkEnrollRowDto)
  rows: BulkEnrollRowDto[];
}
