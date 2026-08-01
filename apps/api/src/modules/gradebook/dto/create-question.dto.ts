// ============================================================================
// create-question.dto.ts — Body de
// "POST /api/v1/courses/:courseId/assessments/:assessmentId/questions".
//
// "body" y "correctAnswer" son JSON libre porque su forma exacta depende
// del "type" (ver gradebook.util.ts, funcion "scoreAnswer", que es quien
// realmente interpreta estas estructuras al calificar). Formas esperadas,
// EN LA PRACTICA, por tipo:
//
//   mcq      body: { options: [{id, text}], allowMultiple }
//            correctAnswer: { optionIds: string[] }
//   tf       body: { statement }
//            correctAnswer: { value: boolean }
//   matching body: { left: [{id,text}], right: [{id,text}] }
//            correctAnswer: { pairs: { [leftId]: rightId } }
//   open     body: { prompt }
//            correctAnswer: {} (nunca se auto-califica, ver gradebook.util.ts)
// ============================================================================

import { IsIn, IsNumber, IsObject, Min } from 'class-validator';

export class CreateQuestionDto {
  @IsIn(['mcq', 'open', 'tf', 'matching'])
  type: 'mcq' | 'open' | 'tf' | 'matching';

  @IsObject()
  body: Record<string, unknown>;

  @IsObject()
  correctAnswer: Record<string, unknown>;

  @IsNumber()
  @Min(0)
  points: number;
}
