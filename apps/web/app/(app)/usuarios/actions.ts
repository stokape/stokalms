'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

const PATH = '/usuarios';

export async function asignarRol(userTenantId: string, formData: FormData) {
  const token = await requireAccessToken();
  const roleId = String(formData.get('roleId') ?? '');
  const scopeCourseId = String(formData.get('scopeCourseId') ?? '').trim();

  try {
    await apiFetch(token, `/users/${userTenantId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roleId, ...(scopeCourseId && { scopeCourseId }) }),
    });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(PATH);
}

export async function quitarRol(userTenantId: string, userRoleId: string) {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/users/${userTenantId}/roles/${userRoleId}`, { method: 'DELETE' });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  redirect(PATH);
}

// Asignar un rol a un GRUPO de personas ya visibles en la lista, elegidas
// con checkboxes — sin CSV, para el caso comun de "estos 5 son Docentes".
// Los checkboxes de cada fila NO estan anidados dentro de este <form> (ver
// page.tsx: viven dentro de cada <details>, y HTML no permite <form> dentro
// de <form>) — se asocian via el atributo "form" nativo, apuntando al id de
// este formulario, asi que llegan igual en el FormData sin ninguna linea de
// JavaScript. Reutiliza el mismo endpoint que el CSV (bulk-assign-role, ver
// arriba) porque el resultado es identico: N filas de "email + roleId".
export async function asignarRolMasivo(formData: FormData) {
  const token = await requireAccessToken();
  const roleId = String(formData.get('roleId') ?? '');
  const emails = formData.getAll('emails').map(String);

  if (emails.length === 0) {
    redirect(`${PATH}?error=${encodeURIComponent('Selecciona al menos una persona antes de asignar un rol.')}`);
  }

  const rows = emails.map((email) => ({ email, roleId }));

  let results: Array<{ email: string; status: 'asignado' | 'ya_tenia' | 'error'; message?: string }>;
  try {
    const response = await apiFetch<{ results: typeof results }>(token, '/users/bulk-assign-role', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
    results = response.results;
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  const okCount = results.filter((r) => r.status === 'asignado' || r.status === 'ya_tenia').length;
  const errors = results.filter((r) => r.status === 'error').slice(0, 20);

  revalidatePath(PATH);
  redirect(`${PATH}?bulkOk=${okCount}&bulkErrors=${encodeURIComponent(JSON.stringify(errors))}`);
}

// "Gestion avanzada de usuarios": asignar un rol a muchas personas de una
// vez desde un CSV de dos columnas "email,nombre del rol" — mismo patron
// que matricularCSV (ver cursos/[courseId]/secciones/[sectionId]/actions.ts):
// el PARSEO pasa por el frontend, el backend recibe filas ya estructuradas
// (ver bulk-assign-role.dto.ts). El nombre del rol se resuelve aca contra
// "GET /roles" (sin distinguir mayusculas/minusculas ni espacios de mas,
// para que un CSV escrito a mano no falle por un detalle de tipeo).
export async function asignarRolesCSV(formData: FormData) {
  const token = await requireAccessToken();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    redirect(`${PATH}?error=${encodeURIComponent('Elige un archivo CSV para subir.')}`);
  }

  const text = await (file as File).text();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const dataLines =
    lines.length > 0 && lines[0].toLowerCase().startsWith('email') ? lines.slice(1) : lines;

  const roles = await apiFetch<Array<{ id: string; name: string }>>(token, '/roles');
  const roleIdByName = new Map(roles.map((r) => [r.name.trim().toLowerCase(), r.id]));

  const rows: Array<{ email: string; roleId: string }> = [];
  const unresolvedRoles: string[] = [];
  for (const line of dataLines) {
    const [email, roleName] = line.split(',').map((s) => s?.trim());
    if (!email || !roleName) continue;
    const roleId = roleIdByName.get(roleName.toLowerCase());
    if (!roleId) {
      unresolvedRoles.push(roleName);
      continue;
    }
    rows.push({ email, roleId });
  }

  if (unresolvedRoles.length > 0) {
    redirect(
      `${PATH}?error=${encodeURIComponent(`No reconocemos el rol "${unresolvedRoles[0]}" — revisa que el nombre coincida exactamente con uno de los roles existentes.`)}`,
    );
  }
  if (rows.length === 0) {
    redirect(`${PATH}?error=${encodeURIComponent('El archivo no tiene ninguna fila con datos.')}`);
  }

  let results: Array<{ email: string; status: 'asignado' | 'ya_tenia' | 'error'; message?: string }>;
  try {
    const response = await apiFetch<{ results: typeof results }>(token, '/users/bulk-assign-role', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
    results = response.results;
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  const okCount = results.filter((r) => r.status === 'asignado' || r.status === 'ya_tenia').length;
  const errors = results.filter((r) => r.status === 'error').slice(0, 20);

  revalidatePath(PATH);
  redirect(`${PATH}?bulkOk=${okCount}&bulkErrors=${encodeURIComponent(JSON.stringify(errors))}`);
}
