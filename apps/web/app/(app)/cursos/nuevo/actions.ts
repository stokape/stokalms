'use server';

// ============================================================================
// cursos/nuevo/actions.ts — Crear un curso, y crear un periodo SIN salir de
// esta pantalla (popup, ver CursoForms.tsx).
//
// NINGUNA de las dos llama a redirect(): se detecto en produccion que
// redirect() dentro de una Server Action dispara un re-renderizado interno
// de Next.js donde headers()/cookies() dejan de reflejar el request real
// (ver la nota extensa en periodos/actions.ts) -- "El dominio no corresponde
// a ninguna institucion" aparecia justo despues de crear un curso o un
// periodo desde aca. En su lugar, ambas devuelven un ActionState (ver
// lib/action-state.ts) que CursoForms.tsx consume con useActionState: la
// navegacion a /cursos/<id> la hace el CLIENTE (useActionRedirect, un
// router.push real) y la creacion del periodo simplemente devuelve el
// periodo creado para que el formulario lo agregue a su <select> sin recargar
// nada.
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import type { ActionState } from '@/lib/action-state';

export async function crearCurso(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  // "|| undefined", no "" a secas: el DTO (ver create-course.dto.ts) marca
  // termId @IsOptional(), pero class-validator SOLO se salta la validacion
  // cuando el valor es undefined/null -- un string vacio igual llega a
  // @IsUUID() y lo rechaza. Mismo criterio que gradingScaleId/
  // certificateTemplateId, un par de lineas mas abajo.
  const termId = String(formData.get('termId') ?? '').trim();
  const code = String(formData.get('code') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const gradingScaleId = String(formData.get('gradingScaleId') ?? '').trim();
  const certificateTemplateId = String(formData.get('certificateTemplateId') ?? '').trim();

  let created: { id: string };
  try {
    created = await apiFetch<{ id: string }>(token, '/courses', {
      method: 'POST',
      body: JSON.stringify({
        termId: termId || undefined,
        code,
        title,
        gradingScaleId: gradingScaleId || undefined,
        certificateTemplateId: certificateTemplateId || undefined,
      }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  return { error: null, redirectTo: `/cursos/${created.id}` };
}

export type CrearPeriodoDesdeCursoState = {
  error: string | null;
  term?: { id: string; name: string };
};

export async function crearPeriodoDesdeCurso(
  _prevState: CrearPeriodoDesdeCursoState,
  formData: FormData,
): Promise<CrearPeriodoDesdeCursoState> {
  const token = await requireAccessToken();
  const name = String(formData.get('name') ?? '').trim();
  const startDate = String(formData.get('startDate') ?? '');
  const endDate = String(formData.get('endDate') ?? '');

  let created: { id: string };
  try {
    created = await apiFetch<{ id: string }>(token, '/terms', {
      method: 'POST',
      body: JSON.stringify({ name, startDate, endDate }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  return { error: null, term: { id: created.id, name } };
}
