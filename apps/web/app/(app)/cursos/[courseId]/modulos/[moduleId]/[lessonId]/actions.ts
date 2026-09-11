'use server';

// ============================================================================
// [lessonId]/actions.ts — Editar el contenido de la Lección, sus Recursos
// (subir archivo/enlace, editar, borrar) y generar preguntas con IA.
//
// NINGUNA llama a redirect(): se detecto en produccion que redirect() dentro
// de una Server Action dispara un re-renderizado interno de Next.js donde
// headers()/cookies() dejan de reflejar el request real (ver la nota
// extensa en periodos/actions.ts). Todas devuelven un ActionState (ver
// LessonForms.tsx, que las consume con useActionState) y revalidatePath()
// alcanza para reflejar el cambio sin navegar a ningun lado. El resultado de
// la IA (antes viajaba codificado en la URL del redirect) ahora viaja en el
// propio estado que devuelve la Server Action.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, apiFetchUpload, toErrorMessage } from '@/lib/api';
import type { ActionState } from '@/lib/action-state';

function lessonPath(courseId: string, moduleId: string, lessonId: string) {
  return `/cursos/${courseId}/modulos/${moduleId}/${lessonId}`;
}

export async function actualizarLeccion(
  courseId: string,
  moduleId: string,
  lessonId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '');

  try {
    await apiFetch(token, `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title, content }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(lessonPath(courseId, moduleId, lessonId));
  return { error: null };
}

export async function actualizarRecurso(
  courseId: string,
  moduleId: string,
  lessonId: string,
  resourceId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
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
    return { error: toErrorMessage(err) };
  }

  revalidatePath(lessonPath(courseId, moduleId, lessonId));
  return { error: null };
}

export async function subirRecurso(
  courseId: string,
  moduleId: string,
  lessonId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const file = formData.get('file');
  const title = String(formData.get('title') ?? '').trim();

  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Elige un archivo para subir.' };
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
    return { error: toErrorMessage(err) };
  }

  revalidatePath(lessonPath(courseId, moduleId, lessonId));
  return { error: null };
}

export async function crearRecursoEnlace(
  courseId: string,
  moduleId: string,
  lessonId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
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
    return { error: toErrorMessage(err) };
  }

  revalidatePath(lessonPath(courseId, moduleId, lessonId));
  return { error: null };
}

export type GeneratedQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
};

export type AiActionState = {
  error: string | null;
  notConfigured?: boolean;
  questions?: GeneratedQuestion[];
};

// "Funcionalidades de IA" (plan Pro) — genera preguntas BORRADOR desde el
// contenido de la lección (ver ai.service.ts, backend).
export async function generarPreguntasIA(
  courseId: string,
  moduleId: string,
  lessonId: string,
  _prevState: AiActionState,
): Promise<AiActionState> {
  const token = await requireAccessToken();

  let result: { configured: boolean; questions?: GeneratedQuestion[]; error?: string };
  try {
    result = await apiFetch(
      token,
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/generate-questions`,
      { method: 'POST' },
    );
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  if (!result.configured) {
    return { error: null, notConfigured: true };
  }
  if (result.error) {
    return { error: result.error };
  }

  return { error: null, questions: result.questions };
}

export async function eliminarRecurso(
  courseId: string,
  moduleId: string,
  lessonId: string,
  resourceId: string,
  _prevState: ActionState,
): Promise<ActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(
      token,
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/resources/${resourceId}`,
      { method: 'DELETE' },
    );
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(lessonPath(courseId, moduleId, lessonId));
  return { error: null };
}
