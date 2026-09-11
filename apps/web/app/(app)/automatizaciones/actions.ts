'use server';

// ============================================================================
// automatizaciones/actions.ts — Prender/apagar las automatizaciones del
// tenant. Ver apps/api/src/modules/automations/.
//
// No llama a redirect() (ver la nota extensa en periodos/actions.ts):
// devuelve un estado que AutomatizacionesForm.tsx consume con
// useActionState, revalidatePath alcanza para reflejar el cambio sin
// navegar a ningun lado.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

const PATH = '/automatizaciones';

export type AutomatizacionesActionState = { error: string | null; saved?: boolean };

export async function guardarAutomatizaciones(
  _prevState: AutomatizacionesActionState,
  formData: FormData,
): Promise<AutomatizacionesActionState> {
  const token = await requireAccessToken();
  const autoIssueCertificate = formData.get('autoIssueCertificate') === 'on';
  const dueDateReminders = formData.get('dueDateReminders') === 'on';
  const inactivityAlerts = formData.get('inactivityAlerts') === 'on';
  const atRiskWeeklyDigest = formData.get('atRiskWeeklyDigest') === 'on';

  try {
    await apiFetch(token, '/automations/settings', {
      method: 'PATCH',
      body: JSON.stringify({ autoIssueCertificate, dueDateReminders, inactivityAlerts, atRiskWeeklyDigest }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(PATH);
  return { error: null, saved: true };
}
