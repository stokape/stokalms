// ============================================================================
// content.module.ts — Agrupa Módulos, Lecciones y Recursos: el contenido de
// un curso (Course > Module > Lesson > Resource, ver schema.prisma). Se
// llama "content" y no "academic" porque academic.module.ts ya existe para
// Term/Course/Section (la estructura "administrativa" del curso); esta es
// la capa de "qué aprende el estudiante dentro de ese curso".
// ============================================================================

import { Module } from '@nestjs/common';
import { ModuleController } from './module.controller';
import { ModuleService } from './module.service';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { ResourceController } from './resource.controller';
import { ResourceService } from './resource.service';

@Module({
  // No hace falta importar AcademicModule ni StorageModule: TenantContextService
  // ya está disponible globalmente (ver common/tenant/tenant.module.ts) y
  // StorageService también (ver common/storage/storage.module.ts, @Global()).
  controllers: [ModuleController, LessonController, ResourceController],
  providers: [ModuleService, LessonService, ResourceService],
})
export class ContentModule {}
