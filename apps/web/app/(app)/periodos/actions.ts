'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

const PATH = '/periodos';

export async function eliminarPeriodo(termId: string) {
  const token = await requireAccessToken();

  try {
    // Si el periodo todavia tiene cursos, el backend rechaza el borrado
    // (ver Course.term, onDelete: Restrict en schema.prisma) en vez de
    // arrastrarlos en cascada -- el mensaje de error de Prisma llega tal
    // cual via toErrorMessage/ErrorBanner.
    await apiFetch(token, `/terms/${termId}`, { method: 'DELETE' });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(PATH);
}

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
