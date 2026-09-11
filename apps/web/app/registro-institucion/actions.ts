'use server';

// ============================================================================
// registro-institucion/actions.ts — Crear una solicitud de alta. No llama a
// redirect() (ver la nota extensa en periodos/actions.ts): esta misma
// pantalla lee headers() directo (para mostrar el dominio raiz real, ver
// page.tsx) — el re-render post-redirect() de Next.js le devolvia el host
// INTERNO del contenedor en vez del dominio publico real. Ahora la accion
// devuelve un estado que RegistrationForm.tsx consume con useActionState, y
// la confirmacion de "enviado" se muestra sin navegar a ningun lado.
// ============================================================================

import { apiFetchPublic, toErrorMessage } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';

export type SolicitudActionState = { error: string | null; submitted?: boolean };

export async function crearSolicitud(
  _prevState: SolicitudActionState,
  formData: FormData,
): Promise<SolicitudActionState> {
  const dto = {
    institutionName: String(formData.get('institutionName') ?? '').trim(),
    desiredSubdomain: String(formData.get('desiredSubdomain') ?? '').trim().toLowerCase(),
    contactName: String(formData.get('contactName') ?? '').trim(),
    contactEmail: String(formData.get('contactEmail') ?? '').trim(),
    message: String(formData.get('message') ?? '').trim() || undefined,
  };

  try {
    // Publica: quien completa este formulario todavia no tiene cuenta en
    // la plataforma (ver POST /tenant-registration-requests, sin ningun
    // guard, en tenant-registration.controller.ts).
    await apiFetchPublic('/tenant-registration-requests', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  void trackEvent('registration_submitted');
  return { error: null, submitted: true };
}
