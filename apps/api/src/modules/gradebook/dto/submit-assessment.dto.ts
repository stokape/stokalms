// ============================================================================
// submit-assessment.dto.ts — Body de
// "POST /api/v1/courses/:courseId/assessments/:assessmentId/submissions".
//
// El estudiante manda UNA respuesta por cada pregunta que la evaluacion
// tenga (ver submission.service.ts: se valida que "answers" cubra
// EXACTAMENTE las preguntas de la evaluacion, ni de mas ni de menos).
// ============================================================================

import { IsArray, IsDefined, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerItemDto {
  @IsUUID()
  questionId: string;

  // La forma de "answer" depende del tipo de pregunta (ver
  // create-question.dto.ts) — aqui se acepta cualquier JSON y
  // gradebook.util.ts (scoreAnswer) es quien la interpreta.
  //
  // @IsDefined() (no exige un tipo especifico, solo que el campo este
  // presente) es NECESARIO aqui, no cosmetico: el ValidationPipe global
  // (ver main.ts) usa "forbidNonWhitelisted: true", que rechaza cualquier
  // propiedad del body sin AL MENOS un decorador de class-validator — sin
  // esto, Nest respondia 400 "answer should not exist" para CUALQUIER
  // intento de entrega, detectado probando un envio real.
  @IsDefined()
  answer: unknown;
}

export class SubmitAssessmentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers: AnswerItemDto[];
}
