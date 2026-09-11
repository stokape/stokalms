'use server';

// ============================================================================
// dominios/actions.ts — Agregar/verificar/borrar un dominio propio. NINGUNA
// llama a redirect() (ver la nota extensa en periodos/actions.ts): devuelven
// un estado que DominioForms.tsx consume con useActionState, revalidatePath
// alcanza para reflejar el cambio sin navegar a ningun lado.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

const PATH = '/dominios';

export type DominioActionState = { error: string | null; saved?: boolean };

export async function agregarDominio(
  _prevState: DominioActionState,
  formData: FormData,
): Promise<DominioActionState> {
  const token = await requireAccessToken();
  const domain = String(formData.get('domain') ?? '').trim();

  try {
    await apiFetch(token, '/tenant/domains', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(PATH);
  return { error: null, saved: true };
}

export async function verificarDominio(
  domainId: string,
  _prevState: DominioActionState,
): Promise<DominioActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/tenant/domains/${domainId}/verify`, { method: 'PATCH' });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(PATH);
  return { error: null, saved: true };
}

export async function eliminarDominio(
  domainId: string,
  _prevState: DominioActionState,
): Promise<DominioActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/tenant/domains/${domainId}`, { method: 'DELETE' });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(PATH);
  return { error: null, saved: true };
}
