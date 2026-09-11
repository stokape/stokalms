'use server';

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

const PATH = '/periodos';

// Estado que devuelve cada accion para useActionState (ver PeriodosForms.tsx)
// -- NINGUNA de las dos llama a redirect(): se detecto en produccion que
// redirect() dentro de una Server Action dispara un re-renderizado interno
// de Next.js donde headers()/cookies() dejan de reflejar el request real
// (ver la nota extensa en lib/api.ts) -- "El dominio no corresponde a
// ninguna institucion" aparecia justo despues de crear/borrar un periodo,
// tapando el mensaje real (ej. "no se puede borrar, tiene cursos"). Sacar
// solo el revalidatePath() de antes de redirect() NO alcanzo (se
// confirmo en produccion que el redirect() en si mismo, incluso solo, ya
// dispara el problema) -- la unica forma confiable es no redirigir en
// absoluto: sin redirect(), React ya refresca la pantalla actual con datos
// frescos por su cuenta (pedido real del navegador, con headers/cookies
// correctos) apenas la Server Action termina.
export type PeriodoActionState = { error: string | null };

export async function eliminarPeriodo(
  termId: string,
  _prevState: PeriodoActionState,
): Promise<PeriodoActionState> {
  const token = await requireAccessToken();

  try {
    // Si el periodo todavia tiene cursos, el backend rechaza el borrado
    // (ver Course.term, onDelete: Restrict en schema.prisma) en vez de
    // arrastrarlos en cascada -- el mensaje de error de Prisma llega tal
    // cual via toErrorMessage.
    await apiFetch(token, `/terms/${termId}`, { method: 'DELETE' });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(PATH);
  return { error: null };
}

export async function crearPeriodo(
  _prevState: PeriodoActionState,
  formData: FormData,
): Promise<PeriodoActionState> {
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
    return { error: toErrorMessage(err) };
  }

  revalidatePath(PATH);
  return { error: null };
}
