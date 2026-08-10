'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, apiFetchUpload, toErrorMessage } from '@/lib/api';

const PATH = '/perfil';

// Reusa el MISMO endpoint de staff (PATCH /users/:userTenantId/profile,
// ver user-management/user.service.ts) apuntado a la PROPIA membresia —
// solo aparece en pantalla si quien mira tiene "user_profile:edit" (ver
// page.tsx), o sea que ya podia editar el perfil de CUALQUIERA en su
// tenant; esto simplemente le permite hacerlo tambien sobre si mismo, sin
// tener que buscarse en "Usuarios y roles" primero.
export async function actualizarMiPerfil(userTenantId: string, formData: FormData) {
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
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(`${PATH}?ok=1`);
}

export async function actualizarFoto(formData: FormData) {
  const token = await requireAccessToken();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    redirect(`${PATH}?error=${encodeURIComponent('Elige una imagen para subir.')}`);
  }

  const uploadForm = new FormData();
  uploadForm.append('file', file);

  try {
    await apiFetchUpload(token, '/profile/photo', uploadForm);
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(PATH);
}
