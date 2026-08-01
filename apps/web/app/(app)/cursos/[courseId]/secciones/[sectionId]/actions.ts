// ============================================================================
// actions.ts — Server Actions (funciones que corren en el SERVIDOR aunque
// las dispare un formulario del navegador) para matricular estudiantes y
// cambiar el estado de una matricula existente en esta seccion.
//
// PATRON DE ERRORES usado en TODA la app (ver tambien las otras
// actions.ts): como los formularios de estas pantallas son Server
// Components normales (sin "use client"), una Server Action no tiene forma
// de devolverle un mensaje de error directo al formulario que la llamo —
// por eso, ante un error, se redirige a la MISMA pagina con
// "?error=mensaje" en la URL, y la pagina (ver page.tsx) lee ese parametro
// y lo muestra con <ErrorBanner>. Si el formulario necesitara mostrar el
// error SIN recargar la pagina, la alternativa seria convertirlo en un
// Client Component con el hook "useActionState" — no hace falta esa
// complejidad para el alcance actual.
// ============================================================================

'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

export async function matricular(courseId: string, sectionId: string, formData: FormData) {
  const token = await requireAccessToken();
  const path = `/cursos/${courseId}/secciones/${sectionId}`;

  const email = String(formData.get('email') ?? '').trim();
  const fullNameRaw = String(formData.get('fullName') ?? '').trim();

  try {
    await apiFetch(token, `/courses/${courseId}/sections/${sectionId}/enrollments`, {
      method: 'POST',
      body: JSON.stringify({ email, ...(fullNameRaw && { fullName: fullNameRaw }) }),
    });
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(path);
}

export async function cambiarEstadoMatricula(
  courseId: string,
  sectionId: string,
  enrollmentId: string,
  status: 'active' | 'dropped' | 'completed',
) {
  const token = await requireAccessToken();
  const path = `/cursos/${courseId}/secciones/${sectionId}`;

  try {
    await apiFetch(token, `/courses/${courseId}/sections/${sectionId}/enrollments/${enrollmentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(path);
}
