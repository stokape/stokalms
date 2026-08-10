'use server';

// ============================================================================
// cohortes/actions.ts — Crear/editar/borrar cohortes y agregar/quitar
// miembros. Ver apps/api/src/modules/cohort/.
// ============================================================================

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

const PATH = '/cohortes';

export async function crearCohorte(formData: FormData) {
  const token = await requireAccessToken();
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();

  try {
    await apiFetch(token, '/cohorts', {
      method: 'POST',
      body: JSON.stringify({ name, ...(description && { description }) }),
    });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(PATH);
}

export async function eliminarCohorte(cohortId: string) {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/cohorts/${cohortId}`, { method: 'DELETE' });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(PATH);
}

export async function agregarMiembro(cohortId: string, formData: FormData) {
  const token = await requireAccessToken();
  const userTenantId = String(formData.get('userTenantId') ?? '');
  const path = `${PATH}/${cohortId}`;

  try {
    await apiFetch(token, `/cohorts/${cohortId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userTenantId }),
    });
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(path);
}

export async function quitarMiembro(cohortId: string, userTenantId: string) {
  const token = await requireAccessToken();
  const path = `${PATH}/${cohortId}`;

  try {
    await apiFetch(token, `/cohorts/${cohortId}/members/${userTenantId}`, { method: 'DELETE' });
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(path);
}
