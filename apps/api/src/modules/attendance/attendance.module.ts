// ============================================================================
// attendance.module.ts — Asistencia de alumnos por sección (ver
// docs/architecture/06-roadmap.md, "Control de asistencia"). No importa
// EnrollmentModule: valida la matrícula directamente contra Prisma, dentro
// del mismo tenant, igual que EnrollmentModule hace con Section.
// ============================================================================

import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
