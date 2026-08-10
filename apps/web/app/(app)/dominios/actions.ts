'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

const PATH = '/dominios';

export async function agregarDominio(formData: FormData) {
  const token = await requireAccessToken();
  const domain = String(formData.get('domain') ?? '').trim();

  try {
    await apiFetch(token, '/tenant/domains', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(`${PATH}?saved=1`);
}

export async function verificarDominio(domainId: string) {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/tenant/domains/${domainId}/verify`, { method: 'PATCH' });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(`${PATH}?saved=1`);
}

export async function eliminarDominio(domainId: string) {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/tenant/domains/${domainId}`, { method: 'DELETE' });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(`${PATH}?saved=1`);
}
