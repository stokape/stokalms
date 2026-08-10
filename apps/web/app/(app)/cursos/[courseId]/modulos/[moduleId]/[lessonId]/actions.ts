'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, apiFetchUpload, toErrorMessage } from '@/lib/api';

function lessonPath(courseId: string, moduleId: string, lessonId: string) {
  return `/cursos/${courseId}/modulos/${moduleId}/${lessonId}`;
}

export async function actualizarLeccion(
  courseId: string,
  moduleId: string,
  lessonId: string,
  formData: FormData,
) {
  const token = await requireAccessToken();
  const path = lessonPath(courseId, moduleId, lessonId);
  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '');

  try {
    await apiFetch(token, `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title, content }),
    });
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(path);
}

export async function actualizarRecurso(
  courseId: string,
  moduleId: string,
  lessonId: string,
  resourceId: string,
  formData: FormData,
) {
  const token = await requireAccessToken();
  const path = lessonPath(courseId, moduleId, lessonId);
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const url = String(formData.get('url') ?? '').trim();

  try {
    await apiFetch(
      token,
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/resources/${resourceId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          title: title || undefined,
          description: description || undefined,
          url: url || undefined,
        }),
      },
    );
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(path);
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
    redirect(`${path}?error=${encodeURIComponent('Elige un archivo para subir.')}`);
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

// "Funcionalidades de IA" (plan Pro) — genera preguntas BORRADOR desde el
// contenido de la lección (ver ai.service.ts, backend). El resultado viaja
// de vuelta como query param en el redirect (mismo patrón que
// "?bulkOk=...&bulkErrors=..." en usuarios/actions.ts): esta pantalla es un
// Server Component sin estado de cliente, así que no hay otra forma de
// "mostrar el resultado de la última acción" sin agregar un Client
// Component solo para esto.
export async function generarPreguntasIA(
  courseId: string,
  moduleId: string,
  lessonId: string,
  _formData: FormData,
) {
  const token = await requireAccessToken();
  const path = lessonPath(courseId, moduleId, lessonId);

  let result: { configured: boolean; questions?: unknown; error?: string };
  try {
    result = await apiFetch(
      token,
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/generate-questions`,
      { method: 'POST' },
    );
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  if (!result.configured) {
    redirect(`${path}?aiNotConfigured=1`);
  }
  if (result.error) {
    redirect(`${path}?error=${encodeURIComponent(result.error)}`);
  }

  redirect(`${path}?aiQuestions=${encodeURIComponent(Buffer.from(JSON.stringify(result.questions)).toString('base64url'))}`);
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
