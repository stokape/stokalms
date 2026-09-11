'use server';

// ============================================================================
// seguridad/actions.ts — Prender/apagar "exigir 2FA". Ver security.service.ts.
//
// No llama a redirect() (ver la nota extensa en periodos/actions.ts):
// devuelve un estado que SeguridadForm.tsx consume con useActionState,
// revalidatePath alcanza para reflejar el cambio sin navegar a ningun lado.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

const PATH = '/seguridad';

export type SeguridadActionState = {
  error: string | null;
  saved?: boolean;
  appliedTo?: number;
  pending?: number;
};

export async function guardarSeguridad(
  _prevState: SeguridadActionState,
  formData: FormData,
): Promise<SeguridadActionState> {
  const token = await requireAccessToken();
  const require2FA = formData.get('require2FA') === 'on';

  let result: { appliedTo?: number; pending?: number };
  try {
    result = await apiFetch(token, '/security/settings', {
      method: 'PATCH',
      body: JSON.stringify({ require2FA }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(PATH);
  return {
    error: null,
    saved: true,
    ...(require2FA && result.appliedTo !== undefined
      ? { appliedTo: result.appliedTo, pending: result.pending ?? 0 }
      : {}),
  };
}
