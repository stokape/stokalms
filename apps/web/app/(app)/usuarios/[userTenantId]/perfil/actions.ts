'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

export async function actualizarPerfilDeAlumno(userTenantId: string, formData: FormData) {
  const token = await requireAccessToken();
  const path = `/usuarios/${userTenantId}/perfil`;

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
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(`${path}?ok=1`);
}
