'use server';

// ============================================================================
// sustentos/actions.ts — Subir un archivo de respaldo. No llama a redirect()
// (ver la nota extensa en periodos/actions.ts): devuelve un ActionState que
// SustentoForm.tsx consume con useActionState, revalidatePath alcanza para
// que la lista se actualice sin navegar a ningun lado.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetchUpload, toErrorMessage } from '@/lib/api';
import type { ActionState } from '@/lib/action-state';

export async function subirSustento(
  courseId: string,
  sectionId: string,
  enrollmentId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const file = formData.get('file');
  const description = String(formData.get('description') ?? '').trim();

  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Elige un archivo para subir.' };
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
    return { error: toErrorMessage(err) };
  }

  revalidatePath(`/cursos/${courseId}/secciones/${sectionId}/enrollments/${enrollmentId}/sustentos`);
  return { error: null };
}
