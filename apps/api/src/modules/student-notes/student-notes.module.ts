// ============================================================================
// student-notes.module.ts — Anotaciones de desempeño que un Docente deja
// sobre un alumno puntual (ver schema.prisma, modelo StudentNote).
// ============================================================================

import { Module } from '@nestjs/common';
import { StudentNoteController } from './student-note.controller';
import { StudentNoteService } from './student-note.service';

@Module({
  controllers: [StudentNoteController],
  providers: [StudentNoteService],
})
export class StudentNotesModule {}
