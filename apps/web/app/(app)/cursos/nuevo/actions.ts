'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

export async function crearCurso(formData: FormData) {
  const token = await requireAccessToken();
  const termId = String(formData.get('termId') ?? '');
  const code = String(formData.get('code') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const gradingScaleId = String(formData.get('gradingScaleId') ?? '').trim();
  const certificateTemplateId = String(formData.get('certificateTemplateId') ?? '').trim();

  let created: { id: string };
  try {
    created = await apiFetch<{ id: string }>(token, '/courses', {
      method: 'POST',
      body: JSON.stringify({
        termId,
        code,
        title,
        gradingScaleId: gradingScaleId || undefined,
        certificateTemplateId: certificateTemplateId || undefined,
      }),
    });
  } catch (err) {
    redirect(`/cursos/nuevo?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath('/cursos');
  redirect(`/cursos/${created.id}`);
}
