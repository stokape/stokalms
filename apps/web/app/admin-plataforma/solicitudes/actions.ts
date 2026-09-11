'use server';

// ============================================================================
// admin-plataforma/solicitudes/actions.ts — Aprobar/rechazar una solicitud.
//
// NINGUNA llama a redirect() (ver la nota extensa en periodos/actions.ts):
// esta misma pantalla lee headers() directo (para armar el link "Ir a la
// institución", ver page.tsx) — el re-render post-redirect() de Next.js le
// devolvia el host INTERNO del contenedor en vez del dominio publico real.
// Ahora devuelven un ActionState que SolicitudForms.tsx consume con
// useActionState, revalidatePath alcanza para reflejar el cambio sin
// navegar a ningun lado.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { setTempCredentialsCookie } from '../temp-credentials';
import type { ActionState } from '@/lib/action-state';

const PATH = '/admin-plataforma/solicitudes';

interface ProvisionedTenant {
  tenantId: string;
  domain: string;
  temporaryPassword: string | null;
  keycloakWarning: string | null;
}

export async function aprobarSolicitud(id: string, _prevState: ActionState): Promise<ActionState> {
  const token = await requireAccessToken();

  let result: ProvisionedTenant;
  try {
    result = await apiFetch<ProvisionedTenant>(token, `/tenant-registration-requests/${id}/approve`, {
      method: 'PATCH',
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  // Ver temp-credentials.ts: la contraseña temporal NUNCA va en la URL.
  await setTempCredentialsCookie({
    domain: result.domain,
    temporaryPassword: result.temporaryPassword,
    keycloakWarning: result.keycloakWarning,
  });

  revalidatePath(PATH);
  return { error: null };
}

export async function rechazarSolicitud(
  id: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const reason = String(formData.get('reason') ?? '').trim();

  try {
    await apiFetch(token, `/tenant-registration-requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason: reason || undefined }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(PATH);
  return { error: null };
}
