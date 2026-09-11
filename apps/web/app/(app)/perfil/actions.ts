'use server';

// ============================================================================
// perfil/actions.ts — Actualizar mi propio perfil / mi foto. NINGUNA llama a
// redirect() (ver la nota extensa en periodos/actions.ts): devuelven un
// estado que MiPerfilForms.tsx consume con useActionState, revalidatePath
// alcanza para reflejar el cambio sin navegar a ningun lado.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, apiFetchUpload, toErrorMessage } from '@/lib/api';

const PATH = '/perfil';

export type PerfilActionState = { error: string | null; saved?: boolean };

// Reusa el MISMO endpoint de staff (PATCH /users/:userTenantId/profile,
// ver user-management/user.service.ts) apuntado a la PROPIA membresia —
// solo aparece en pantalla si quien mira tiene "user_profile:edit" (ver
// page.tsx), o sea que ya podia editar el perfil de CUALQUIERA en su
// tenant; esto simplemente le permite hacerlo tambien sobre si mismo, sin
// tener que buscarse en "Usuarios y roles" primero.
export async function actualizarMiPerfil(
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

  revalidatePath(PATH);
  return { error: null, saved: true };
}

export async function actualizarFoto(
  _prevState: PerfilActionState,
  formData: FormData,
): Promise<PerfilActionState> {
  const token = await requireAccessToken();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Elige una imagen para subir.' };
  }

  const uploadForm = new FormData();
  uploadForm.append('file', file);

  try {
    await apiFetchUpload(token, '/profile/photo', uploadForm);
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(PATH);
  return { error: null };
}
