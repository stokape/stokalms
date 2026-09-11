'use server';

// ============================================================================
// notificaciones/actions.ts — Marcar una notificación como leída (y navegar
// a donde apunta) / marcar todas como leídas. NINGUNA llama a redirect() (ver
// la nota extensa en periodos/actions.ts): "marcarLeidaYIr" devuelve
// "redirectTo" para que el CLIENTE navegue con router.push() (ver
// NotificacionForms.tsx / useActionRedirect.ts) -- un request real del
// navegador, sin el problema de redirect(). "marcarTodasLeidas" se queda en
// la misma pantalla, revalidatePath alcanza.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import type { ActionState } from '@/lib/action-state';

const PATH = '/notificaciones';

// Marca UNA notificación como leída y, en el mismo paso, lleva a donde esa
// notificación apunta (o de vuelta a la lista, si no tiene destino) — el
// título de cada fila ES este formulario (ver page.tsx), así que "hacer
// clic en el título" resuelve las dos cosas a la vez.
export async function marcarLeidaYIr(
  id: string,
  link: string | null,
  _prevState: ActionState,
): Promise<ActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/notifications/${id}/read`, { method: 'POST' });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  return { error: null, redirectTo: link || PATH };
}

export async function marcarTodasLeidas(_prevState: ActionState): Promise<ActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, '/notifications/read-all', { method: 'POST' });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(PATH);
  return { error: null };
}
