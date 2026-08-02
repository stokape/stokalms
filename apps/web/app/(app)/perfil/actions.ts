'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetchUpload, toErrorMessage } from '@/lib/api';

const PATH = '/perfil';

export async function actualizarFoto(formData: FormData) {
  const token = await requireAccessToken();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    redirect(`${PATH}?error=${encodeURIComponent('Elegí una imagen para subir.')}`);
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
