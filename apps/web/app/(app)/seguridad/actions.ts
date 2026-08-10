'use server';

// ============================================================================
// seguridad/actions.ts — Prender/apagar "exigir 2FA". Ver security.service.ts.
// ============================================================================

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

const PATH = '/seguridad';

export async function guardarSeguridad(formData: FormData) {
  const token = await requireAccessToken();
  const require2FA = formData.get('require2FA') === 'on';

  let result: { appliedTo?: number; pending?: number };
  try {
    result = await apiFetch(token, '/security/settings', {
      method: 'PATCH',
      body: JSON.stringify({ require2FA }),
    });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  const extra =
    require2FA && result.appliedTo !== undefined
      ? `&appliedTo=${result.appliedTo}&pending=${result.pending ?? 0}`
      : '';
  redirect(`${PATH}?saved=1${extra}`);
}
