'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

export async function asignarEscalaDeNotas(courseId: string, formData: FormData) {
  const token = await requireAccessToken();
  const path = `/cursos/${courseId}`;
  const gradingScaleId = String(formData.get('gradingScaleId') ?? '');

  try {
    await apiFetch(token, `/courses/${courseId}`, {
      method: 'PATCH',
      body: JSON.stringify({ gradingScaleId }),
    });
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(path);
}

export async function asignarPlantillaDeCertificado(courseId: string, formData: FormData) {
  const token = await requireAccessToken();
  const path = `/cursos/${courseId}`;
  const certificateTemplateId = String(formData.get('certificateTemplateId') ?? '');

  try {
    await apiFetch(token, `/courses/${courseId}`, {
      method: 'PATCH',
      body: JSON.stringify({ certificateTemplateId }),
    });
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(path);
}
