'use server';

// ============================================================================
// asistencia/actions.ts — Marcar asistencia. No llama a redirect() (ver la
// nota extensa en periodos/actions.ts): devuelve un ActionState que
// AsistenciaForm.tsx consume con useActionState, revalidatePath alcanza
// para reflejar lo guardado sin navegar a ningun lado.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

export type AsistenciaActionState = { error: string | null; saved?: boolean };

export async function marcarAsistencia(
  courseId: string,
  sectionId: string,
  _prevState: AsistenciaActionState,
  formData: FormData,
): Promise<AsistenciaActionState> {
  const token = await requireAccessToken();
  const sessionDate = String(formData.get('sessionDate') ?? '');

  // Cada fila del roster llega como un campo "status_<enrollmentId>" (ver
  // el <select> por alumno en page.tsx) — se arma el arreglo de registros
  // recorriendo esas claves en vez de depender de un indice numerico, que
  // se desincroniza fácil si la lista de alumnos cambia entre el render y
  // el envío del formulario.
  const records = Array.from(formData.entries())
    .filter(([key]) => key.startsWith('status_'))
    .map(([key, value]) => ({
      enrollmentId: key.slice('status_'.length),
      status: String(value),
    }));

  try {
    await apiFetch(token, `/courses/${courseId}/sections/${sectionId}/attendance`, {
      method: 'POST',
      body: JSON.stringify({ sessionDate, records }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(`/cursos/${courseId}/secciones/${sectionId}/asistencia`);
  return { error: null, saved: true };
}
