// ============================================================================
// create-student-note.dto.ts — Body de
// "POST .../enrollments/:enrollmentId/notes".
// ============================================================================

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateStudentNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body: string;
}
