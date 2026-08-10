'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

export async function crearSeccion(courseId: string, formData: FormData) {
  const token = await requireAccessToken();
  const name = String(formData.get('name') ?? '').trim();
  const capacity = Number(formData.get('capacity') ?? 0);

  let created: { id: string };
  try {
    created = await apiFetch<{ id: string }>(token, `/courses/${courseId}/sections`, {
      method: 'POST',
      body: JSON.stringify({ name, capacity }),
    });
  } catch (err) {
    redirect(
      `/cursos/${courseId}/secciones/nueva?error=${encodeURIComponent(toErrorMessage(err))}`,
    );
  }

  revalidatePath(`/cursos/${courseId}`);
  redirect(`/cursos/${courseId}/secciones/${created.id}`);
}
