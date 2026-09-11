'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

export async function crearCurso(formData: FormData) {
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
    redirect(`/cursos/nuevo?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath('/cursos');
  redirect(`/cursos/${created.id}`);
}

// Crear un periodo SIN salir de "crear curso" (popup, ver page.tsx) --
// a diferencia de periodos/actions.ts#crearPeriodo (que vuelve a
// /periodos), esta version vuelve a ESTA pantalla con el periodo recien
// creado ya preseleccionado (?termCreado=<id>), para no perder el resto
// de lo que la persona ya habia completado del formulario de curso.
export async function crearPeriodoDesdeCurso(formData: FormData) {
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
    redirect(`/cursos/nuevo?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath('/cursos/nuevo');
  redirect(`/cursos/nuevo?termCreado=${created.id}`);
}
