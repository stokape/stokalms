'use server';

// ============================================================================
// reportes/actions.ts — "Reportes personalizados" (plan Pro, ver
// apps/api/src/modules/reports/reports.service.ts): crear/eliminar un
// preset de columnas guardado. Generarlo/exportarlo NO pasa por acá — son
// simples GET (ver reportes/page.tsx y reportes/export/[type]/route.ts),
// nada que mutar.
// ============================================================================

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

const PATH = '/reportes';

export async function crearReportePersonalizado(formData: FormData) {
  const token = await requireAccessToken();
  const name = String(formData.get('name') ?? '').trim();
  const reportType = String(formData.get('reportType') ?? '');
  const columns = formData.getAll('columns').map(String);

  if (!name || columns.length === 0) {
    redirect(`${PATH}?error=${encodeURIComponent('Elige un nombre y al menos una columna.')}`);
  }

  try {
    await apiFetch(token, '/reports/presets', {
      method: 'POST',
      body: JSON.stringify({ name, reportType, columns }),
    });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(PATH);
}

export async function eliminarReportePersonalizado(presetId: string) {
  const token = await requireAccessToken();
  try {
    await apiFetch(token, `/reports/presets/${presetId}`, { method: 'DELETE' });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }
  revalidatePath(PATH);
  redirect(PATH);
}
