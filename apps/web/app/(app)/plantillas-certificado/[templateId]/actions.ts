'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
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

  revalidatePath(path);
  redirect(`${path}?saved=1`);
}

export async function eliminarPlantilla(templateId: string) {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/certificate-templates/${templateId}`, { method: 'DELETE' });
  } catch (err) {
    redirect(`/plantillas-certificado/${templateId}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath('/plantillas-certificado');
  redirect('/plantillas-certificado');
}
