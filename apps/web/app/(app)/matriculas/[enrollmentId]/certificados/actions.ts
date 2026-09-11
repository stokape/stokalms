'use server';

import { redirect } from 'next/navigation';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

// Sin "templateId": se emite con la plantilla FIJA del curso (ver la nota
// extensa en page.tsx y en certificate.service.ts, "issue").
export async function emitirCertificado(enrollmentId: string, _formData: FormData) {
  const token = await requireAccessToken();
  const path = `/matriculas/${enrollmentId}/certificados`;

  try {
    await apiFetch(token, `/enrollments/${enrollmentId}/certificates`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

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

  redirect(path);
}
