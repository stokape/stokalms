'use server';

import { redirect } from 'next/navigation';
import { apiFetchPublic, toErrorMessage } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';

export async function crearSolicitud(formData: FormData) {
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
    redirect(`/registro-institucion?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  void trackEvent('registration_submitted');
  redirect('/registro-institucion?enviado=1');
}
