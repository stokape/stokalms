'use server';

// ============================================================================
// secciones/nueva/actions.ts — Crear una Sección. No llama a redirect() (ver
// la nota extensa en periodos/actions.ts): devuelve un ActionState y el
// CLIENTE navega a la sección recien creada con router.push() (ver
// SeccionForm.tsx / useActionRedirect.ts).
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import type { ActionState } from '@/lib/action-state';

export async function crearSeccion(
  courseId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const name = String(formData.get('name') ?? '').trim();
  const capacity = Number(formData.get('capacity') ?? 0);

  let created: { id: string };
  try {
    created = await apiFetch<{ id: string }>(token, `/courses/${courseId}/sections`, {
      method: 'POST',
      body: JSON.stringify({ name, capacity }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  return { error: null, redirectTo: `/cursos/${courseId}/secciones/${created.id}` };
}
