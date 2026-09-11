'use server';

// ============================================================================
// [templateId]/actions.ts — Editar/borrar una plantilla. NINGUNA llama a
// redirect() (ver la nota extensa en periodos/actions.ts): editar se queda
// en la misma pantalla (revalidatePath alcanza); borrar SI cambia de
// pantalla (no queda plantilla que mostrar), asi que devuelve "redirectTo"
// para que el cliente navegue con router.push() (ver useActionRedirect.ts).
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import type { ActionState } from '@/lib/action-state';

export type PlantillaActionState = { error: string | null; saved?: boolean; redirectTo?: string };

export async function editarPlantilla(
  templateId: string,
  _prevState: PlantillaActionState,
  formData: FormData,
): Promise<PlantillaActionState> {
  const token = await requireAccessToken();

  const name = String(formData.get('name') ?? '').trim();
  const htmlTemplate = String(formData.get('htmlTemplate') ?? '');

  try {
    await apiFetch(token, `/certificate-templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, htmlTemplate }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(`/plantillas-certificado/${templateId}`);
  return { error: null, saved: true };
}

export async function eliminarPlantilla(
  templateId: string,
  _prevState: ActionState,
): Promise<ActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/certificate-templates/${templateId}`, { method: 'DELETE' });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath('/plantillas-certificado');
  return { error: null, redirectTo: '/plantillas-certificado' };
}
