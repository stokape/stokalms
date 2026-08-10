// ============================================================================
// ai.service.ts — "Funcionalidades de IA" (plan Pro, ver lib/pricing.ts).
// Un solo caso de uso en este MVP: generar un banco de preguntas de opcion
// multiple a partir del texto de una leccion (ver lesson.service.ts,
// "generateQuestions"), para que un Docente no arranque un examen desde
// cero — SIEMPRE como borrador para revisar, nunca insertado solo en un
// Assessment real (una IA se equivoca; una persona sigue decidiendo que
// entra al examen de verdad).
//
// Mismo criterio "apagado por defecto, sin romper nada" que MailService
// (ver common/mail/mail.service.ts): sin AI_API_KEY configurada,
// "generateQuestionsFromText" devuelve {configured:false} de inmediato,
// nunca lanza. Formato de request/response compatible con "chat
// completions" de OpenAI (AI_BASE_URL apunta ahi por defecto) — varios
// proveedores replican ese mismo formato, asi que activar esto con OTRO
// proveedor es, en general, solo cambiar AI_BASE_URL/AI_MODEL.
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeneratedQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
}

export type GenerateQuestionsResult =
  | { configured: false }
  | { configured: true; questions: GeneratedQuestion[] }
  | { configured: true; error: string };

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly configService: ConfigService) {}

  private get ai(): { apiKey: string; baseUrl: string; model: string } {
    return this.configService.get('ai')!;
  }

  async generateQuestionsFromText(lessonText: string, count = 5): Promise<GenerateQuestionsResult> {
    const { apiKey, baseUrl, model } = this.ai;
    if (!apiKey) {
      return { configured: false };
    }

    const safeCount = Math.min(Math.max(count, 1), 10);
    const prompt = [
      `A partir del siguiente contenido de una lección, genera exactamente ${safeCount} preguntas de opción múltiple en español.`,
      'Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:',
      '{"questions":[{"prompt":"...","options":["...","...","...","..."],"correctIndex":0}]}',
      '"correctIndex" es el índice (empezando en 0) de la opción correcta dentro de "options".',
      'Cada pregunta debe tener entre 3 y 5 opciones.',
      '--- CONTENIDO DE LA LECCIÓN ---',
      lessonText.slice(0, 8000),
    ].join('\n');

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        this.logger.warn(`El proveedor de IA respondió HTTP ${response.status}: ${body}`);
        return { configured: true, error: `El proveedor de IA respondió con un error (HTTP ${response.status}).` };
      }

      const data = await response.json();
      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (!content) {
        return { configured: true, error: 'El proveedor de IA no devolvió contenido.' };
      }

      const parsed = JSON.parse(content);
      const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
      const validQuestions: GeneratedQuestion[] = questions
        .filter(
          (q: unknown): q is GeneratedQuestion =>
            typeof q === 'object' &&
            q !== null &&
            typeof (q as GeneratedQuestion).prompt === 'string' &&
            Array.isArray((q as GeneratedQuestion).options) &&
            (q as GeneratedQuestion).options.length >= 2 &&
            typeof (q as GeneratedQuestion).correctIndex === 'number',
        )
        .slice(0, safeCount);

      if (validQuestions.length === 0) {
        return { configured: true, error: 'El proveedor de IA no devolvió preguntas con un formato válido.' };
      }

      return { configured: true, questions: validQuestions };
    } catch (err) {
      this.logger.warn(`No se pudo generar preguntas con IA: ${err instanceof Error ? err.message : err}`);
      return {
        configured: true,
        error: 'No se pudo contactar al proveedor de IA (revisa la configuración o intenta de nuevo).',
      };
    }
  }
}
