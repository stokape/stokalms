'use server';

// ============================================================================
// certificados/actions.ts — Emitir/revocar un certificado. NINGUNA llama a
// redirect() (ver la nota extensa en periodos/actions.ts): devuelven un
// ActionState que CertificadoForms.tsx consume con useActionState,
// revalidatePath alcanza para reflejar el cambio sin navegar a ningun lado.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import type { ActionState } from '@/lib/action-state';

// Sin "templateId": se emite con la plantilla FIJA del curso (ver la nota
// extensa en page.tsx y en certificate.service.ts, "issue").
export async function emitirCertificado(enrollmentId: string, _prevState: ActionState): Promise<ActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/enrollments/${enrollmentId}/certificates`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(`/matriculas/${enrollmentId}/certificados`);
  return { error: null };
}

export async function revocarCertificado(
  enrollmentId: string,
  certificateId: string,
  _prevState: ActionState,
): Promise<ActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/certificates/${certificateId}/revoke`, { method: 'PATCH' });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(`/matriculas/${enrollmentId}/certificados`);
  return { error: null };
}
