// ============================================================================
// academic-progress.module.ts — "Avance" de un alumno (lecciones vistas,
// evaluaciones rendidas, asistencia, nota parcial). Importa GradebookModule
// para reusar el mismo algoritmo de nota final como nota parcial (ver la
// nota extensa en gradebook.service.ts).
// ============================================================================

import { Module } from '@nestjs/common';
import { GradebookModule } from '../gradebook/gradebook.module';
import { AcademicProgressController } from './academic-progress.controller';
import { AcademicProgressService } from './academic-progress.service';

@Module({
  imports: [GradebookModule],
  controllers: [AcademicProgressController],
  providers: [AcademicProgressService],
})
export class AcademicProgressModule {}
