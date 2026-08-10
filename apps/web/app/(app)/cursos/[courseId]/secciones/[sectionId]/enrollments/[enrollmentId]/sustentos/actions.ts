'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetchUpload, toErrorMessage } from '@/lib/api';

export async function subirSustento(
  courseId: string,
  sectionId: string,
  enrollmentId: string,
  formData: FormData,
) {
  const token = await requireAccessToken();
  const path = `/cursos/${courseId}/secciones/${sectionId}/enrollments/${enrollmentId}/sustentos`;
  const file = formData.get('file');
  const description = String(formData.get('description') ?? '').trim();

  if (!(file instanceof File) || file.size === 0) {
    redirect(`${path}?error=${encodeURIComponent('Elige un archivo para subir.')}`);
  }

  const uploadForm = new FormData();
  uploadForm.append('file', file);
  if (description) uploadForm.append('description', description);

  try {
    await apiFetchUpload(
      token,
      `/courses/${courseId}/sections/${sectionId}/enrollments/${enrollmentId}/attachments`,
      uploadForm,
    );
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(path);
}
