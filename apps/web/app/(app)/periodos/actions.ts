'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

const PATH = '/periodos';

export async function crearPeriodo(formData: FormData) {
  const token = await requireAccessToken();
  const name = String(formData.get('name') ?? '').trim();
  const startDate = String(formData.get('startDate') ?? '');
  const endDate = String(formData.get('endDate') ?? '');

  try {
    await apiFetch(token, '/terms', {
      method: 'POST',
      body: JSON.stringify({ name, startDate, endDate }),
    });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(PATH);
}
