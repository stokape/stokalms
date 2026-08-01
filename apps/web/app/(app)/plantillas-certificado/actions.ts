'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

const PATH = '/plantillas-certificado';

export async function crearPlantilla(formData: FormData) {
  const token = await requireAccessToken();

  const name = String(formData.get('name') ?? '').trim();
  const htmlTemplate = String(formData.get('htmlTemplate') ?? '');

  try {
    await apiFetch(token, '/certificate-templates', {
      method: 'POST',
      body: JSON.stringify({ name, htmlTemplate }),
    });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(PATH);
}
