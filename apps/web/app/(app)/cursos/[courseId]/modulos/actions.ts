'use server';

// ============================================================================
// modulos/actions.ts — Crear/editar/borrar Módulos. NINGUNA llama a
// redirect() (ver la nota extensa en periodos/actions.ts): devuelven un
// ActionState que ModuloForms.tsx consume con useActionState, revalidatePath
// alcanza para reflejar el cambio sin navegar a ningun lado.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import type { ActionState } from '@/lib/action-state';

export async function crearModulo(
  courseId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const title = String(formData.get('title') ?? '').trim();

  try {
    await apiFetch(token, `/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(`/cursos/${courseId}/modulos`);
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

  revalidatePath(`/cursos/${courseId}/modulos`);
  return { error: null };
}

export async function eliminarModulo(
  courseId: string,
  moduleId: string,
  _prevState: ActionState,
): Promise<ActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(`/cursos/${courseId}/modulos`);
  return { error: null };
}
