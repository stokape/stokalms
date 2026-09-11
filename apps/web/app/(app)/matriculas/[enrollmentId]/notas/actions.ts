'use server';

import { redirect } from 'next/navigation';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

export async function crearAnotacion(enrollmentId: string, formData: FormData) {
  const token = await requireAccessToken();
  const path = `/matriculas/${enrollmentId}/notas`;
  const body = String(formData.get('body') ?? '').trim();

  try {
    await apiFetch(token, `/enrollments/${enrollmentId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  redirect(path);
}

export async function eliminarAnotacion(enrollmentId: string, noteId: string) {
  const token = await requireAccessToken();
  const path = `/matriculas/${enrollmentId}/notas`;

  try {
    await apiFetch(token, `/enrollments/${enrollmentId}/notes/${noteId}`, { method: 'DELETE' });
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  redirect(path);
}
