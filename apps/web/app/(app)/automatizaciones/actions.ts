'use server';

// ============================================================================
// automatizaciones/actions.ts — Prender/apagar las automatizaciones del
// tenant. Ver apps/api/src/modules/automations/.
// ============================================================================

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

const PATH = '/automatizaciones';

export async function guardarAutomatizaciones(formData: FormData) {
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
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(`${PATH}?saved=1`);
}
