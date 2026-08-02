'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, apiFetchUpload, toErrorMessage } from '@/lib/api';

function lessonPath(courseId: string, moduleId: string, lessonId: string) {
  return `/cursos/${courseId}/modulos/${moduleId}/${lessonId}`;
}

export async function subirRecurso(
  courseId: string,
  moduleId: string,
  lessonId: string,
  formData: FormData,
) {
  const token = await requireAccessToken();
  const path = lessonPath(courseId, moduleId, lessonId);
  const file = formData.get('file');
  const title = String(formData.get('title') ?? '').trim();

  if (!(file instanceof File) || file.size === 0) {
    redirect(`${path}?error=${encodeURIComponent('Elegí un archivo para subir.')}`);
  }

  // Se arma un FormData NUEVO (en vez de reenviar el que llegó del
  // formulario tal cual) para controlar exactamente qué campos viajan al
  // backend — el que llegó del <form> podría, en teoría, traer campos de
  // más si alguien edita el HTML a mano.
  const uploadForm = new FormData();
  uploadForm.append('file', file);
  if (title) uploadForm.append('title', title);

  try {
    await apiFetchUpload(
      token,
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/resources`,
      uploadForm,
    );
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(path);
}

export async function crearRecursoEnlace(
  courseId: string,
  moduleId: string,
  lessonId: string,
  formData: FormData,
) {
  const token = await requireAccessToken();
  const path = lessonPath(courseId, moduleId, lessonId);
  const title = String(formData.get('title') ?? '').trim();
  const url = String(formData.get('url') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();

  try {
    await apiFetch(
      token,
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/resources/link`,
      { method: 'POST', body: JSON.stringify({ title, url, description: description || undefined }) },
    );
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(path);
}

export async function eliminarRecurso(
  courseId: string,
  moduleId: string,
  lessonId: string,
  resourceId: string,
) {
  const token = await requireAccessToken();
  const path = lessonPath(courseId, moduleId, lessonId);

  try {
    await apiFetch(
      token,
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/resources/${resourceId}`,
      { method: 'DELETE' },
    );
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(path);
}
