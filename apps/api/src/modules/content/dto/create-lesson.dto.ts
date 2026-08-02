// ============================================================================
// create-lesson.dto.ts — Body de "POST .../modules/:moduleId/lessons".
// ============================================================================

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  // Texto/HTML de la lección en sí (lo que un docente escribe directamente,
  // sin necesitar subir un archivo aparte) — los archivos adjuntos (video,
  // PDF, etc.) son Resources, ver resource.controller.ts.
  @IsOptional()
  @IsString()
  content?: string;
}
