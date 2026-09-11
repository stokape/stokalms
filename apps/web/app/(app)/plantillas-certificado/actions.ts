'use server';

// ============================================================================
// plantillas-certificado/actions.ts — Crear una plantilla. No llama a
// redirect() (ver la nota extensa en periodos/actions.ts): devuelve un
// ActionState que CrearPlantillaForm.tsx consume con useActionState,
// revalidatePath alcanza para reflejar el cambio sin navegar a ningun lado.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import type { ActionState } from '@/lib/action-state';

const PATH = '/plantillas-certificado';

export async function crearPlantilla(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const token = await requireAccessToken();

  const name = String(formData.get('name') ?? '').trim();
  const htmlTemplate = String(formData.get('htmlTemplate') ?? '');

  try {
    await apiFetch(token, '/certificate-templates', {
      method: 'POST',
      body: JSON.stringify({ name, htmlTemplate }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(PATH);
  return { error: null };
}
