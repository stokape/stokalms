// ============================================================================
// gradebook.module.ts — Agrupa Evaluaciones/Gradebook completo: escalas de
// notas, categorias de ponderacion, evaluaciones, preguntas, entregas y el
// calculo/publicacion de la nota final de curso (ver
// docs/architecture/06-roadmap.md, Fase 1).
// ============================================================================

import { Module } from '@nestjs/common';
import { GradingScaleController } from './grading-scale.controller';
import { GradingScaleService } from './grading-scale.service';
import { GradebookCategoryController } from './gradebook-category.controller';
import { GradebookCategoryService } from './gradebook-category.service';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';
import { GradebookController } from './gradebook.controller';
import { GradebookService } from './gradebook.service';

@Module({
  controllers: [
    GradingScaleController,
    GradebookCategoryController,
    AssessmentController,
    QuestionController,
    SubmissionController,
    GradebookController,
  ],
  providers: [
    GradingScaleService,
    GradebookCategoryService,
    AssessmentService,
    QuestionService,
    SubmissionService,
    GradebookService,
  ],
})
export class GradebookModule {}
