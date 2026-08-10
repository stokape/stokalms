'use server';

// ============================================================================
// admin-plataforma/instituciones/actions.ts — Activar/desactivar una
// institucion desde el LISTADO (ver page.tsx). La gestion de dominios y
// roles de cada institucion vive en sus propias actions dentro de
// [tenantId]/actions.ts — esta accion se repite ahi tambien (mismo cuerpo)
// porque el listado y el detalle redirigen a paths distintos al terminar.
// ============================================================================

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

const PATH = '/admin-plataforma/instituciones';

export async function cambiarEstadoInstitucion(tenantId: string, active: boolean) {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/platform/tenants/${tenantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(PATH);
}
