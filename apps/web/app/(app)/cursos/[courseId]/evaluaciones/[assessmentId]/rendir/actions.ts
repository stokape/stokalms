'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

interface Question {
  id: string;
  type: string;
  body: Record<string, unknown>;
}

// Reconstruye la respuesta de CADA pregunta a partir de los campos del
// formulario. Se vuelve a pedir las preguntas (en vez de confiar en campos
// ocultos del formulario) porque necesitamos el "body" real (los ids de
// las opciones/items) para armar la misma estructura que scoreAnswer()
// espera en el backend (ver gradebook.util.ts) — iterando SIEMPRE en el
// mismo orden que "body.options"/"body.left" para que la comparacion
// nunca falle por un simple cambio de orden (ver la nota extensa en
// evaluaciones/[assessmentId]/actions.ts, buildQuestionPayload).
function buildAnswer(question: Question, formData: FormData): unknown {
  const field = `q_${question.id}`;

  if (question.type === 'mcq') {
    const options = (question.body.options as { id: string }[] | undefined) ?? [];
    const checked = new Set(formData.getAll(field).map(String));
    return { optionIds: options.filter((o) => checked.has(o.id)).map((o) => o.id) };
  }

  if (question.type === 'tf') {
    return { value: formData.get(field) === 'true' };
  }

  if (question.type === 'matching') {
    const left = (question.body.left as { id: string }[] | undefined) ?? [];
    const pairs: Record<string, string> = {};
    for (const item of left) {
      const rightId = formData.get(`${field}__${item.id}`);
      if (rightId) pairs[item.id] = String(rightId);
    }
    return { pairs };
  }

  return { text: String(formData.get(field) ?? '') };
}

export async function entregarExamen(
  courseId: string,
  assessmentId: string,
  formData: FormData,
) {
  const token = await requireAccessToken();
  const listPath = `/cursos/${courseId}/evaluaciones/${assessmentId}`;

  try {
    const questions = await apiFetch<Question[]>(
      token,
      `/courses/${courseId}/assessments/${assessmentId}/questions`,
    );

    const answers = questions.map((q) => ({ questionId: q.id, answer: buildAnswer(q, formData) }));

    await apiFetch(token, `/courses/${courseId}/assessments/${assessmentId}/submissions`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  } catch (err) {
    redirect(`${listPath}/rendir?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(listPath);
  redirect(listPath);
}
