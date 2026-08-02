'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

function path(courseId: string) {
  return `/cursos/${courseId}/evaluaciones`;
}

export async function crearCategoria(courseId: string, formData: FormData) {
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
    redirect(`${path(courseId)}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path(courseId));
  redirect(path(courseId));
}

export async function crearEvaluacion(courseId: string, formData: FormData) {
  const token = await requireAccessToken();
  const type = String(formData.get('type') ?? '');
  const gradebookCategoryId = String(formData.get('gradebookCategoryId') ?? '');
  const maxPoints = Number(formData.get('maxPoints') ?? 0);
  const maxAttempts = Number(formData.get('maxAttempts') ?? 1);
  const title = String(formData.get('title') ?? '').trim();
  const autoPublish = formData.get('autoPublish') === 'on';

  try {
    await apiFetch(token, `/courses/${courseId}/assessments`, {
      method: 'POST',
      body: JSON.stringify({
        type,
        gradebookCategoryId,
        maxPoints,
        maxAttempts,
        config: { title: title || undefined, autoPublish },
      }),
    });
  } catch (err) {
    redirect(`${path(courseId)}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path(courseId));
  redirect(path(courseId));
}

export async function eliminarEvaluacion(courseId: string, assessmentId: string) {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/courses/${courseId}/assessments/${assessmentId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    redirect(`${path(courseId)}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path(courseId));
  redirect(path(courseId));
}
