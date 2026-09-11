'use server';

// ============================================================================
// admin-plataforma/instituciones/actions.ts — Activar/desactivar una
// institucion desde el LISTADO (ver page.tsx). La gestion de dominios y
// roles de cada institucion vive en sus propias actions dentro de
// [tenantId]/actions.ts.
//
// No llama a redirect() (ver la nota extensa en periodos/actions.ts):
// devuelve un ActionState que EstadoInstitucionButton.tsx consume con
// useActionState, revalidatePath alcanza para reflejar el cambio sin
// navegar a ningun lado.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import type { ActionState } from '@/lib/action-state';

const PATH = '/admin-plataforma/instituciones';

export async function cambiarEstadoInstitucion(
  tenantId: string,
  active: boolean,
  _prevState: ActionState,
): Promise<ActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/platform/tenants/${tenantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(PATH);
  return { error: null };
}
