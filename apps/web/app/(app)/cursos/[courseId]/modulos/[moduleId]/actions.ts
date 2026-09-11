'use server';

// ============================================================================
// modulos/[moduleId]/actions.ts — Crear una Lección, renombrar el Módulo,
// renombrar/borrar una Lección. NINGUNA llama a redirect() (ver la nota
// extensa en periodos/actions.ts): devuelven un ActionState que
// LeccionForms.tsx consume con useActionState, revalidatePath alcanza para
// reflejar el cambio sin navegar a ningun lado.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import type { ActionState } from '@/lib/action-state';

export async function crearLeccion(
  courseId: string,
  moduleId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '');

  try {
    await apiFetch(token, `/courses/${courseId}/modules/${moduleId}/lessons`, {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(`/cursos/${courseId}/modulos/${moduleId}`);
  return { error: null };
}

export async function actualizarModulo(
  courseId: string,
  moduleId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const title = String(formData.get('title') ?? '').trim();

  try {
    await apiFetch(token, `/courses/${courseId}/modules/${moduleId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(`/cursos/${courseId}/modulos/${moduleId}`);
  return { error: null };
}

export async function actualizarLeccionTitulo(
  courseId: string,
  moduleId: string,
  lessonId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const title = String(formData.get('title') ?? '').trim();

  try {
    await apiFetch(token, `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(`/cursos/${courseId}/modulos/${moduleId}`);
  return { error: null };
}

export async function eliminarLeccion(
  courseId: string,
  moduleId: string,
  lessonId: string,
  _prevState: ActionState,
): Promise<ActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(`/cursos/${courseId}/modulos/${moduleId}`);
  return { error: null };
}
