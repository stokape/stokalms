'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

const PATH = '/notificaciones';

// Marca UNA notificación como leída y, en el mismo paso, lleva a donde esa
// notificación apunta (o de vuelta a la lista, si no tiene destino) — el
// título de cada fila ES este formulario (ver page.tsx), así que "hacer
// clic en el título" resuelve las dos cosas a la vez sin ninguna línea de
// JavaScript.
export async function marcarLeidaYIr(id: string, link: string | null, _formData: FormData) {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/notifications/${id}/read`, { method: 'POST' });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(link || PATH);
}

export async function marcarTodasLeidas() {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, '/notifications/read-all', { method: 'POST' });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(PATH);
}
