'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

const PATH = '/admin-plataforma/solicitudes';

export async function aprobarSolicitud(id: string) {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/tenant-registration-requests/${id}/approve`, { method: 'PATCH' });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(PATH);
}

export async function rechazarSolicitud(id: string, formData: FormData) {
  const token = await requireAccessToken();
  const reason = String(formData.get('reason') ?? '').trim();

  try {
    await apiFetch(token, `/tenant-registration-requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason: reason || undefined }),
    });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(PATH);
}
