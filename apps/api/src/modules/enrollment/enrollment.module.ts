// ============================================================================
// enrollment.module.ts — Modulo de Matricula (ver docs/architecture/06-roadmap.md,
// Fase 1). No importa AcademicModule: valida la existencia de Section
// directamente contra Prisma (dentro del mismo tenant), sin necesitar sus
// servicios.
// ============================================================================

import { Module } from '@nestjs/common';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentService } from './enrollment.service';

@Module({
  controllers: [EnrollmentController],
  providers: [EnrollmentService],
})
export class EnrollmentModule {}
