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
import { requireAccessToken, apiFetch, apiFetchUpload, toErrorMessage } from '@/lib/api';

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

// Matricula MASIVA desde un archivo CSV: dos columnas, "email,nombre
// completo" (el nombre solo hace falta si la persona todavia no tiene
// cuenta — ver create-enrollment.dto.ts en el backend). El PARSEO del CSV
// pasa por el frontend a proposito: al backend le llega ya un arreglo de
// filas (ver bulk-enroll.dto.ts) porque parsear un archivo es un detalle
// de presentacion, no una regla de negocio.
export async function matricularCSV(courseId: string, sectionId: string, formData: FormData) {
  const token = await requireAccessToken();
  const path = `/cursos/${courseId}/secciones/${sectionId}`;
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    redirect(`${path}?error=${encodeURIComponent('Elige un archivo CSV para subir.')}`);
  }

  const text = await (file as File).text();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  // Si la primera linea parece un encabezado ("email,..."), se descarta —
  // asi el mismo archivo funciona con o sin fila de titulos.
  const dataLines =
    lines.length > 0 && lines[0].toLowerCase().startsWith('email') ? lines.slice(1) : lines;

  const rows = dataLines.map((line) => {
    const [email, fullName] = line.split(',').map((s) => s?.trim());
    return { email, ...(fullName && { fullName }) };
  });

  if (rows.length === 0) {
    redirect(`${path}?error=${encodeURIComponent('El archivo no tiene ninguna fila con datos.')}`);
  }

  let results: Array<{ email: string; status: 'matriculado' | 'error'; message?: string }>;
  try {
    const response = await apiFetch<{ results: typeof results }>(
      token,
      `/courses/${courseId}/sections/${sectionId}/enrollments/bulk`,
      { method: 'POST', body: JSON.stringify({ rows }) },
    );
    results = response.results;
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  const okCount = results.filter((r) => r.status === 'matriculado').length;
  const errors = results.filter((r) => r.status === 'error').slice(0, 20);

  revalidatePath(path);
  redirect(
    `${path}?bulkOk=${okCount}&bulkErrors=${encodeURIComponent(JSON.stringify(errors))}`,
  );
}

// "Migración de información" (plan Enterprise, ver lib/pricing.ts): traer
// un roster HISTÓRICO de otro sistema — cuatro columnas,
// "email,nombre completo,estado,fecha de matrícula". A diferencia de
// "matricularCSV" (gente que se matricula HOY, siempre "active"), acá cada
// fila ya trae su propio estado y fecha — ver
// import-historical-enrollments.dto.ts en el backend. Mismo criterio de
// "el parseo es un detalle de presentación": el backend recibe filas ya
// estructuradas, nunca el archivo en sí.
export async function importarMatriculaHistoricaCSV(courseId: string, sectionId: string, formData: FormData) {
  const token = await requireAccessToken();
  const path = `/cursos/${courseId}/secciones/${sectionId}`;
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    redirect(`${path}?error=${encodeURIComponent('Elige un archivo CSV para subir.')}`);
  }

  const text = await (file as File).text();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const dataLines =
    lines.length > 0 && lines[0].toLowerCase().startsWith('email') ? lines.slice(1) : lines;

  // "enrolledAt" viaja TAL CUAL como vino en el CSV (sin convertir a ISO
  // aca): una fecha mal escrita en una sola fila no debe poder tumbar TODO
  // el archivo con una excepcion sin atrapar — el backend valida cada fila
  // por separado y la reporta como un error MAS de esa fila (mismo
  // criterio que el email, ver import-historical-enrollments.dto.ts).
  const rows = dataLines.map((line) => {
    const [email, fullName, status, enrolledAt] = line.split(',').map((s) => s?.trim());
    return {
      email,
      ...(fullName && { fullName }),
      status: status || 'active',
      ...(enrolledAt && { enrolledAt }),
    };
  });

  if (rows.length === 0) {
    redirect(`${path}?error=${encodeURIComponent('El archivo no tiene ninguna fila con datos.')}`);
  }

  let results: Array<{ email: string; status: 'importado' | 'error'; message?: string }>;
  try {
    const response = await apiFetch<{ results: typeof results }>(
      token,
      `/courses/${courseId}/sections/${sectionId}/enrollments/import-historical`,
      { method: 'POST', body: JSON.stringify({ rows }) },
    );
    results = response.results;
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  const okCount = results.filter((r) => r.status === 'importado').length;
  const errors = results.filter((r) => r.status === 'error').slice(0, 20);

  revalidatePath(path);
  redirect(`${path}?importOk=${okCount}&importErrors=${encodeURIComponent(JSON.stringify(errors))}`);
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

// Retirar a un alumno ADJUNTANDO un sustento (archivo de respaldo, ej. carta
// de retiro) — el archivo es opcional a propósito: no todo retiro tiene (o
// necesita) un documento, pero quien sí lo tiene puede dejarlo cargado en el
// mismo paso, sin un formulario aparte. Se sube el archivo PRIMERO y recién
// después se cambia el estado: si el archivo falla, la matrícula sigue como
// estaba, en vez de quedar "retirada" sin su respaldo.
export async function retirarConSustento(
  courseId: string,
  sectionId: string,
  enrollmentId: string,
  formData: FormData,
) {
  const token = await requireAccessToken();
  const path = `/cursos/${courseId}/secciones/${sectionId}`;
  const file = formData.get('file');
  const description = String(formData.get('description') ?? '').trim();

  if (file instanceof File && file.size > 0) {
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    if (description) uploadForm.append('description', description);

    try {
      await apiFetchUpload(
        token,
        `/courses/${courseId}/sections/${sectionId}/enrollments/${enrollmentId}/attachments`,
        uploadForm,
      );
    } catch (err) {
      redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
    }
  }

  try {
    await apiFetch(token, `/courses/${courseId}/sections/${sectionId}/enrollments/${enrollmentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'dropped' }),
    });
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path);
  redirect(path);
}
