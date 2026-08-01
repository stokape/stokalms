// ============================================================================
// academic.module.ts — Agrupa Periodos, Cursos y Secciones: la estructura
// academica base de la que dependen Matricula, Evaluaciones y Certificados
// (ver docs/architecture/06-roadmap.md, Fase 1).
// ============================================================================

import { Module } from '@nestjs/common';
import { TermController } from './term.controller';
import { TermService } from './term.service';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { SectionController } from './section.controller';
import { SectionService } from './section.service';

@Module({
  // No hace falta importar TenantModule: es @Global() (ver
  // common/tenant/tenant.module.ts), asi que TenantContextService ya esta
  // disponible aqui automaticamente para TermService/CourseService/SectionService.
  controllers: [TermController, CourseController, SectionController],
  providers: [TermService, CourseService, SectionService],
  // Se exportan los servicios porque el futuro modulo de Matricula
  // (Enrollment) necesita validar, por ejemplo, que una Section exista
  // antes de matricular a alguien en ella.
  exports: [TermService, CourseService, SectionService],
})
export class AcademicModule {}
