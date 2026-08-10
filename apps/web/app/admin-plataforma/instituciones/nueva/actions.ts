'use server';

import { redirect } from 'next/navigation';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { setTempCredentialsCookie } from '../../temp-credentials';

const FORM_PATH = '/admin-plataforma/instituciones/nueva';
const SOLICITUDES_PATH = '/admin-plataforma/solicitudes';

interface ProvisionedTenant {
  tenantId: string;
  domain: string;
  temporaryPassword: string | null;
  keycloakWarning: string | null;
}

export async function crearInstitucionDirecta(formData: FormData) {
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
    redirect(`${FORM_PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
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
  redirect(SOLICITUDES_PATH);
}
