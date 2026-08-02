'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

function path(courseId: string, assessmentId: string) {
  return `/cursos/${courseId}/evaluaciones/${assessmentId}`;
}

function lines(formData: FormData, field: string): string[] {
  return String(formData.get(field) ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

// Arma "body"/"correctAnswer" (ver create-question.dto.ts en el backend)
// segun el tipo elegido. Los ids de opciones/items ("opt1", "l1", "r1"...)
// se generan por ORDEN de aparicion — es la MISMA convencion que usa la
// pantalla de "rendir examen" para reconstruir la respuesta del estudiante
// (ver rendir/actions.ts), asi los dos lados coinciden siempre sin
// necesitar que el docente invente ids a mano.
function buildQuestionPayload(type: string, formData: FormData) {
  if (type === 'mcq') {
    const optionTexts = lines(formData, 'options');
    const options = optionTexts.map((text, i) => ({ id: `opt${i + 1}`, text }));
    const correctIndexes = String(formData.get('correctIndexes') ?? '')
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= options.length);
    const allowMultiple = formData.get('allowMultiple') === 'on';
    return {
      body: { options, allowMultiple },
      correctAnswer: { optionIds: correctIndexes.map((i) => options[i - 1].id) },
    };
  }

  if (type === 'tf') {
    return {
      body: { statement: String(formData.get('statement') ?? '').trim() },
      correctAnswer: { value: formData.get('correctValue') === 'true' },
    };
  }

  if (type === 'matching') {
    const left = lines(formData, 'leftItems').map((text, i) => ({ id: `l${i + 1}`, text }));
    const right = lines(formData, 'rightItems').map((text, i) => ({ id: `r${i + 1}`, text }));
    const pairs: Record<string, string> = {};
    for (const line of lines(formData, 'pairs')) {
      const [leftIdx, rightIdx] = line.split(':').map((s) => parseInt(s.trim(), 10));
      if (left[leftIdx - 1] && right[rightIdx - 1]) {
        pairs[left[leftIdx - 1].id] = right[rightIdx - 1].id;
      }
    }
    return { body: { left, right }, correctAnswer: { pairs } };
  }

  // "open": respuesta abierta, nunca se auto-califica (ver gradebook.util.ts).
  return {
    body: { prompt: String(formData.get('prompt') ?? '').trim() },
    correctAnswer: {},
  };
}

export async function crearPregunta(courseId: string, assessmentId: string, formData: FormData) {
  const token = await requireAccessToken();
  const type = String(formData.get('type') ?? '');
  const points = Number(formData.get('points') ?? 0);
  const { body, correctAnswer } = buildQuestionPayload(type, formData);

  try {
    await apiFetch(token, `/courses/${courseId}/assessments/${assessmentId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ type, body, correctAnswer, points }),
    });
  } catch (err) {
    redirect(`${path(courseId, assessmentId)}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path(courseId, assessmentId));
  redirect(path(courseId, assessmentId));
}

export async function eliminarPregunta(
  courseId: string,
  assessmentId: string,
  questionId: string,
) {
  const token = await requireAccessToken();

  try {
    await apiFetch(
      token,
      `/courses/${courseId}/assessments/${assessmentId}/questions/${questionId}`,
      { method: 'DELETE' },
    );
  } catch (err) {
    redirect(`${path(courseId, assessmentId)}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path(courseId, assessmentId));
  redirect(path(courseId, assessmentId));
}

export async function calificarRespuesta(
  courseId: string,
  assessmentId: string,
  submissionId: string,
  questionId: string,
  formData: FormData,
) {
  const token = await requireAccessToken();
  const score = Number(formData.get('score') ?? 0);
  const feedback = String(formData.get('feedback') ?? '').trim();

  try {
    await apiFetch(
      token,
      `/courses/${courseId}/assessments/${assessmentId}/submissions/${submissionId}/answers/${questionId}`,
      { method: 'PATCH', body: JSON.stringify({ score, feedback: feedback || undefined }) },
    );
  } catch (err) {
    redirect(`${path(courseId, assessmentId)}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path(courseId, assessmentId));
  redirect(path(courseId, assessmentId));
}
