'use server';

// ============================================================================
// notas/actions.ts — Crear/borrar una anotación de desempeño. NINGUNA llama
// a redirect() (ver la nota extensa en periodos/actions.ts): devuelven un
// ActionState que AnotacionForms.tsx consume con useActionState,
// revalidatePath alcanza para reflejar el cambio sin navegar a ningun lado.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import type { ActionState } from '@/lib/action-state';

export async function crearAnotacion(
  enrollmentId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const body = String(formData.get('body') ?? '').trim();

  try {
    await apiFetch(token, `/enrollments/${enrollmentId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(`/matriculas/${enrollmentId}/notas`);
  return { error: null };
}

export async function eliminarAnotacion(
  enrollmentId: string,
  noteId: string,
  _prevState: ActionState,
): Promise<ActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/enrollments/${enrollmentId}/notes/${noteId}`, { method: 'DELETE' });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(`/matriculas/${enrollmentId}/notas`);
  return { error: null };
}
