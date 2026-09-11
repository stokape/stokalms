'use server';

import { redirect } from 'next/navigation';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

export async function editarPlantilla(templateId: string, formData: FormData) {
  const token = await requireAccessToken();
  const path = `/plantillas-certificado/${templateId}`;

  const name = String(formData.get('name') ?? '').trim();
  const htmlTemplate = String(formData.get('htmlTemplate') ?? '');

  try {
    await apiFetch(token, `/certificate-templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, htmlTemplate }),
    });
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  redirect(`${path}?saved=1`);
}

export async function eliminarPlantilla(templateId: string) {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/certificate-templates/${templateId}`, { method: 'DELETE' });
  } catch (err) {
    redirect(`/plantillas-certificado/${templateId}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  redirect('/plantillas-certificado');
}
