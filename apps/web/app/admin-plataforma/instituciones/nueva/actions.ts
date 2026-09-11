'use server';

// ============================================================================
// admin-plataforma/instituciones/nueva/actions.ts — Alta directa de una
// institución. No llama a redirect() (ver la nota extensa en
// periodos/actions.ts): esta pantalla y /solicitudes leen headers() directo
// (para armar el subdominio/links) — el re-render post-redirect() de
// Next.js les devolvia el host INTERNO del contenedor. Ahora devuelve un
// ActionState y el CLIENTE navega a /solicitudes con router.push() (ver
// DirectCreateForm.tsx / useActionRedirect.ts).
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { setTempCredentialsCookie } from '../../temp-credentials';
import type { ActionState } from '@/lib/action-state';

const SOLICITUDES_PATH = '/admin-plataforma/solicitudes';

interface ProvisionedTenant {
  tenantId: string;
  domain: string;
  temporaryPassword: string | null;
  keycloakWarning: string | null;
}

export async function crearInstitucionDirecta(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const dto = {
    institutionName: String(formData.get('institutionName') ?? '').trim(),
    desiredSubdomain: String(formData.get('desiredSubdomain') ?? '').trim().toLowerCase(),
    contactName: String(formData.get('contactName') ?? '').trim(),
    contactEmail: String(formData.get('contactEmail') ?? '').trim(),
    message: String(formData.get('message') ?? '').trim() || undefined,
  };

  let result: ProvisionedTenant;
  try {
    result = await apiFetch<ProvisionedTenant>(token, '/tenant-registration-requests/direct', {
      method: 'POST',
      body: JSON.stringify(dto),
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

  // El resultado se muestra en /solicitudes (mismo banner que "Aprobar"
  // usa) — asi ese listado, que ya incluye esta institucion en "Ya
  // revisadas" (ver tenant-registration.service.ts, "createDirect"),
  // queda como el unico lugar que muestra el resultado de CUALQUIER alta,
  // directa o por solicitud.
  return { error: null, redirectTo: SOLICITUDES_PATH };
}
