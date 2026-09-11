'use server';

// ============================================================================
// cursos/[courseId]/actions.ts — Asignar escala de notas / plantilla de
// certificado a un curso ya creado, y eliminarlo.
//
// NINGUNA de las tres llama a redirect(): ver la nota extensa en
// periodos/actions.ts sobre por que redirect() dentro de una Server Action
// rompe headers()/cookies() en produccion ("El dominio no corresponde a
// ninguna institucion" aparecia justo despues de asignar/eliminar algo
// desde acá). Asignar se queda en la misma pantalla (revalidatePath alcanza,
// Next vuelve a pedir los datos del Server Component tras la accion,
// como con router.refresh()); eliminar SI cambia de pantalla (no queda
// curso que mostrar), asi que devuelve "redirectTo" para que el cliente
// navegue con router.push() (ver useActionRedirect.ts) -- un request real
// del navegador, sin el problema de redirect().
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import type { ActionState } from '@/lib/action-state';

export async function asignarEscalaDeNotas(
  courseId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const gradingScaleId = String(formData.get('gradingScaleId') ?? '');

  try {
    await apiFetch(token, `/courses/${courseId}`, {
      method: 'PATCH',
      body: JSON.stringify({ gradingScaleId }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(`/cursos/${courseId}`);
  return { error: null };
}

export async function asignarPlantillaDeCertificado(
  courseId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const certificateTemplateId = String(formData.get('certificateTemplateId') ?? '');

  try {
    await apiFetch(token, `/courses/${courseId}`, {
      method: 'PATCH',
      body: JSON.stringify({ certificateTemplateId }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(`/cursos/${courseId}`);
  return { error: null };
}

export async function eliminarCurso(
  courseId: string,
  _prevState: ActionState,
): Promise<ActionState> {
  const token = await requireAccessToken();

  try {
    // Si el curso todavia tiene secciones/matriculas, el backend rechaza el
    // borrado (ver onDelete: Restrict en schema.prisma) en vez de arrastrarlas
    // en cascada -- el mensaje de error de Prisma llega tal cual via
    // toErrorMessage.
    await apiFetch(token, `/courses/${courseId}`, { method: 'DELETE' });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath('/cursos');
  return { error: null, redirectTo: '/cursos' };
}
