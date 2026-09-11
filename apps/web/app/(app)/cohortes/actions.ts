'use server';

// ============================================================================
// cohortes/actions.ts — Crear/borrar grupos y agregar/quitar miembros. Ver
// apps/api/src/modules/cohort/ (el modelo/permiso en el backend se sigue
// llamando "cohort" — solo el nombre que ve la persona usuaria cambió a
// "Grupo", ver page.tsx).
//
// NINGUNA de las cuatro llama a redirect(): ver la nota extensa en
// periodos/actions.ts sobre por que redirect() dentro de una Server Action
// rompe headers()/cookies() en produccion. Crear/agregar/quitar se quedan en
// la misma pantalla (revalidatePath alcanza); eliminar SI cambia de pantalla
// (no queda grupo que mostrar), asi que devuelve "redirectTo" para que el
// cliente navegue con router.push() (ver useActionRedirect.ts).
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import type { ActionState } from '@/lib/action-state';

const PATH = '/cohortes';

export async function crearCohorte(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();

  try {
    await apiFetch(token, '/cohorts', {
      method: 'POST',
      body: JSON.stringify({ name, ...(description && { description }) }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(PATH);
  return { error: null };
}

export async function eliminarCohorte(
  cohortId: string,
  _prevState: ActionState,
): Promise<ActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/cohorts/${cohortId}`, { method: 'DELETE' });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(PATH);
  return { error: null, redirectTo: PATH };
}

export async function agregarMiembro(
  cohortId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const userTenantId = String(formData.get('userTenantId') ?? '');
  const path = `${PATH}/${cohortId}`;

  try {
    await apiFetch(token, `/cohorts/${cohortId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userTenantId }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(path);
  return { error: null };
}

export async function quitarMiembro(
  cohortId: string,
  userTenantId: string,
  _prevState: ActionState,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const path = `${PATH}/${cohortId}`;

  try {
    await apiFetch(token, `/cohorts/${cohortId}/members/${userTenantId}`, { method: 'DELETE' });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(path);
  return { error: null };
}
