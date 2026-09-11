'use server';

// ============================================================================
// reportes/actions.ts — "Reportes personalizados" (plan Pro, ver
// apps/api/src/modules/reports/reports.service.ts): crear/eliminar un
// preset de columnas guardado. Generarlo/exportarlo NO pasa por acá — son
// simples GET (ver reportes/page.tsx y reportes/export/[type]/route.ts),
// nada que mutar.
//
// NINGUNA llama a redirect() (ver la nota extensa en periodos/actions.ts):
// devuelven un ActionState que ReporteForms.tsx consume con useActionState,
// revalidatePath alcanza para reflejar el cambio sin navegar a ningun lado.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import type { ActionState } from '@/lib/action-state';

const PATH = '/reportes';

export async function crearReportePersonalizado(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const name = String(formData.get('name') ?? '').trim();
  const reportType = String(formData.get('reportType') ?? '');
  const columns = formData.getAll('columns').map(String);

  if (!name || columns.length === 0) {
    return { error: 'Elige un nombre y al menos una columna.' };
  }

  try {
    await apiFetch(token, '/reports/presets', {
      method: 'POST',
      body: JSON.stringify({ name, reportType, columns }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(PATH);
  return { error: null };
}

export async function eliminarReportePersonalizado(
  presetId: string,
  _prevState: ActionState,
): Promise<ActionState> {
  const token = await requireAccessToken();
  try {
    await apiFetch(token, `/reports/presets/${presetId}`, { method: 'DELETE' });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }
  revalidatePath(PATH);
  return { error: null };
}
