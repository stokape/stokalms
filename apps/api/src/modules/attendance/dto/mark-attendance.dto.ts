// ============================================================================
// mark-attendance.dto.ts — Body de
// "POST /courses/:courseId/sections/:sectionId/attendance".
//
// Un solo pedido marca la asistencia de TODA la sección para una fecha de
// sesión puntual (una fila por alumno) — igual que un Docente pasa lista una
// sola vez por clase, no alumno por alumno. Volver a enviar la misma fecha
// CORRIGE los registros existentes (ver attendance.service.ts, "mark", y el
// "@@unique([enrollmentId, sessionDate])" en schema.prisma) en vez de
// duplicarlos.
// ============================================================================

import { ArrayMinSize, IsArray, IsDateString, IsIn, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

const STATUSES = ['present', 'absent', 'late', 'excused'] as const;

class AttendanceRecordRowDto {
  @IsString()
  @IsNotEmpty()
  enrollmentId: string;

  @IsIn(STATUSES)
  status: (typeof STATUSES)[number];
}

export class MarkAttendanceDto {
  @IsDateString()
  sessionDate: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordRowDto)
  records: AttendanceRecordRowDto[];
}
