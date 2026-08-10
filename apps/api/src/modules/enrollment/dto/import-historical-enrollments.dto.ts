// ============================================================================
// import-historical-enrollments.dto.ts — Body de
// "POST /courses/:courseId/sections/:sectionId/enrollments/import-historical"
// ("Migracion de informacion", plan Enterprise, ver lib/pricing.ts).
//
// A diferencia de BulkEnrollDto (matricular gente NUEVA, hoy, siempre
// "active"), cada fila aca ya trae su estado y fecha de matricula
// HISTORICA — es traer un roster que ya existia en otro sistema, no
// inscribir gente de cero. No incluye nota final: ver la nota extensa en
// enrollment.service.ts, "importHistorical", sobre por que fabricar
// evidencia de evaluacion queda fuera de alcance a proposito.
// ============================================================================

import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ImportHistoricalEnrollmentRowDto {
  // "status"/"enrolledAt" tambien son solo @IsString() aca, SIN @IsIn()/
  // @IsISO8601() — igual que el email, se validan fila por fila DENTRO del
  // servicio (ver enrollment.service.ts, "importHistorical"): con un
  // decorador de class-validator, UNA fila con un estado mal escrito o una
  // fecha invalida tumbaria el archivo ENTERO con un 400 antes de
  // procesar ninguna fila (ValidationPipe corre sobre el array completo,
  // no fila por fila) — exactamente lo que BulkEnrollRowDto ya evita para
  // el email, mismo motivo aca.
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @IsOptional()
  @IsString()
  status?: string;

  // Fecha de matricula ORIGINAL en el sistema anterior — opcional: sin
  // ella, queda "hoy" (mismo default que Enrollment.enrolledAt).
  @IsOptional()
  @IsString()
  enrolledAt?: string;
}

export class ImportHistoricalEnrollmentsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImportHistoricalEnrollmentRowDto)
  rows: ImportHistoricalEnrollmentRowDto[];
}
