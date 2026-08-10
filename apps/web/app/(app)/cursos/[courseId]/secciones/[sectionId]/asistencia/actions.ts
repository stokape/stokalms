'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

export async function marcarAsistencia(courseId: string, sectionId: string, formData: FormData) {
  const token = await requireAccessToken();
  const sessionDate = String(formData.get('sessionDate') ?? '');
  const path = `/cursos/${courseId}/secciones/${sectionId}/asistencia?date=${sessionDate}`;

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
    redirect(`${path}&error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(`${path}&ok=1`);
}
