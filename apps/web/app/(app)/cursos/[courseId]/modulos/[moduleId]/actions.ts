'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

export async function crearLeccion(courseId: string, moduleId: string, formData: FormData) {
  const token = await requireAccessToken();
  const path = `/cursos/${courseId}/modulos/${moduleId}`;
  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '');

  try {
    await apiFetch(token, `/courses/${courseId}/modules/${moduleId}/lessons`, {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(path);
}

export async function eliminarLeccion(courseId: string, moduleId: string, lessonId: string) {
  const token = await requireAccessToken();
  const path = `/cursos/${courseId}/modulos/${moduleId}`;

  try {
    await apiFetch(token, `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(path);
}
