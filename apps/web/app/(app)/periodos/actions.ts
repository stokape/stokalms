'use server';

import { redirect } from 'next/navigation';
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

  // Sin revalidatePath(PATH) aca a proposito -- ver la nota extensa en
  // crearPeriodo() mas abajo.
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

  // Sin revalidatePath(PATH) aca a proposito: redirect() al MISMO path que
  // se acaba de invalidar disparaba un re-renderizado interno de Next.js
  // donde headers()/cookies() dejaban de reflejar el request real (ver la
  // nota extensa en lib/api.ts) -- "El dominio no corresponde a ninguna
  // institucion" aparecia en la pantalla de /periodos justo despues de
  // crear/borrar uno, tapando el mensaje real (ej. "no se puede borrar,
  // tiene cursos"). redirect() ya fuerza que la pagina se vuelva a pedir
  // fresca por su cuenta, revalidatePath() era redundante en este caso
  // puntual (path de origen === path de destino).
  redirect(PATH);
}
