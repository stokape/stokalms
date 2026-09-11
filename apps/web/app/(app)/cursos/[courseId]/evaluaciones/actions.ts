'use server';

// ============================================================================
// evaluaciones/actions.ts — Crear categoría de notas, crear/borrar
// Evaluación. NINGUNA llama a redirect() (ver la nota extensa en
// periodos/actions.ts): devuelven un ActionState que EvaluacionForms.tsx
// consume con useActionState, revalidatePath alcanza para reflejar el
// cambio sin navegar a ningun lado.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import type { ActionState } from '@/lib/action-state';

function path(courseId: string) {
  return `/cursos/${courseId}/evaluaciones`;
}

export async function crearCategoria(
  courseId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const name = String(formData.get('name') ?? '').trim();
  const weightPct = Number(formData.get('weightPct') ?? 0);
  const dropLowest = Number(formData.get('dropLowest') ?? 0);

  try {
    await apiFetch(token, `/courses/${courseId}/gradebook-categories`, {
      method: 'POST',
      body: JSON.stringify({ name, weightPct, dropLowest }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(path(courseId));
  return { error: null };
}

export async function crearEvaluacion(
  courseId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const type = String(formData.get('type') ?? '');
  const gradebookCategoryId = String(formData.get('gradebookCategoryId') ?? '');
  const maxPoints = Number(formData.get('maxPoints') ?? 0);
  const maxAttempts = Number(formData.get('maxAttempts') ?? 1);
  const title = String(formData.get('title') ?? '').trim();
  const autoPublish = formData.get('autoPublish') === 'on';
  const moduleId = String(formData.get('moduleId') ?? '').trim();

  try {
    await apiFetch(token, `/courses/${courseId}/assessments`, {
      method: 'POST',
      body: JSON.stringify({
        type,
        gradebookCategoryId,
        maxPoints,
        maxAttempts,
        moduleId: moduleId || undefined,
        config: { title: title || undefined, autoPublish },
      }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(path(courseId));
  return { error: null };
}

export async function eliminarEvaluacion(
  courseId: string,
  assessmentId: string,
  _prevState: ActionState,
): Promise<ActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/courses/${courseId}/assessments/${assessmentId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(path(courseId));
  return { error: null };
}
