'use server';

// ============================================================================
// perfil/actions.ts — Actualizar el perfil de otra persona. No llama a
// redirect() (ver la nota extensa en periodos/actions.ts): devuelve un
// estado que PerfilForm.tsx consume con useActionState, revalidatePath
// alcanza para reflejar el cambio sin navegar a ningun lado.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

export type PerfilActionState = { error: string | null; saved?: boolean };

export async function actualizarPerfilDeAlumno(
  userTenantId: string,
  _prevState: PerfilActionState,
  formData: FormData,
): Promise<PerfilActionState> {
  const token = await requireAccessToken();

  const fields = ['firstName', 'lastName', 'phone', 'address', 'department', 'province', 'district'];
  const body: Record<string, string> = {};
  for (const field of fields) {
    const value = String(formData.get(field) ?? '').trim();
    if (value) body[field] = value;
  }

  try {
    await apiFetch(token, `/users/${userTenantId}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(`/usuarios/${userTenantId}/perfil`);
  return { error: null, saved: true };
}
