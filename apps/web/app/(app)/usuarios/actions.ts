'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

const PATH = '/usuarios';

export async function asignarRol(userTenantId: string, formData: FormData) {
  const token = await requireAccessToken();
  const roleId = String(formData.get('roleId') ?? '');
  const scopeCourseId = String(formData.get('scopeCourseId') ?? '').trim();

  try {
    await apiFetch(token, `/users/${userTenantId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roleId, ...(scopeCourseId && { scopeCourseId }) }),
    });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(PATH);
}

export async function quitarRol(userTenantId: string, userRoleId: string) {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/users/${userTenantId}/roles/${userRoleId}`, { method: 'DELETE' });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(PATH);
}
