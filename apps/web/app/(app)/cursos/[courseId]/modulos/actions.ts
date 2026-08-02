'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

export async function crearModulo(courseId: string, formData: FormData) {
  const token = await requireAccessToken();
  const path = `/cursos/${courseId}/modulos`;
  const title = String(formData.get('title') ?? '').trim();

  try {
    await apiFetch(token, `/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(path);
}

export async function eliminarModulo(courseId: string, moduleId: string) {
  const token = await requireAccessToken();
  const path = `/cursos/${courseId}/modulos`;

  try {
    await apiFetch(token, `/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' });
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(path);
}
