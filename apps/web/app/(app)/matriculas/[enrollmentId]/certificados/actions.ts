'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

export async function emitirCertificado(enrollmentId: string, formData: FormData) {
  const token = await requireAccessToken();
  const path = `/matriculas/${enrollmentId}/certificados`;
  const templateId = String(formData.get('templateId') ?? '');

  try {
    await apiFetch(token, `/enrollments/${enrollmentId}/certificates`, {
      method: 'POST',
      body: JSON.stringify({ templateId }),
    });
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(path);
}

export async function revocarCertificado(enrollmentId: string, certificateId: string) {
  const token = await requireAccessToken();
  const path = `/matriculas/${enrollmentId}/certificados`;

  try {
    await apiFetch(token, `/certificates/${certificateId}/revoke`, { method: 'PATCH' });
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(path);
}
