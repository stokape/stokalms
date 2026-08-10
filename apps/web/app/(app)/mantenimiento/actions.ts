'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, apiFetchUpload, toErrorMessage } from '@/lib/api';

const PATH = '/mantenimiento';

// Un unico formulario (ver page.tsx) prende/apaga el modo mantenimiento Y
// guarda el mensaje/fecha en el mismo envio — separarlo en dos acciones
// (una para el switch, otra para el texto) solo agregaba un paso extra sin
// ningun beneficio real.
export async function guardarMantenimiento(formData: FormData) {
  const token = await requireAccessToken();

  const maintenanceMode = formData.get('maintenanceMode') === 'on';
  const maintenanceMessage = String(formData.get('maintenanceMessage') ?? '').trim();
  const rawEndsAt = String(formData.get('maintenanceEndsAt') ?? '').trim();
  // El <input type="datetime-local"> manda una hora SIN zona horaria (ej.
  // "2026-08-08T14:30") — new Date(...) la interpreta como hora LOCAL del
  // servidor (mismo huso que "timezone" del tenant, America/Lima por
  // defecto), que es justo lo que espera quien la tipeo.
  const maintenanceEndsAt = rawEndsAt ? new Date(rawEndsAt).toISOString() : '';

  try {
    await apiFetch(token, '/tenant', {
      method: 'PATCH',
      body: JSON.stringify({ maintenanceMode, maintenanceMessage, maintenanceEndsAt }),
    });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  // El home publico y el resto de la app (ver app/page.tsx y
  // (app)/layout.tsx) leen "maintenanceMode" en cada visita: hay que
  // invalidar tambien esas rutas, no solo esta pantalla.
  revalidatePath(PATH);
  revalidatePath('/');
  redirect(`${PATH}?saved=1`);
}

// Imagen de fondo del landing de mantenimiento — libre, no tiene que ser la
// misma que el fondo de todos los dias (ver la nota en tenant.service.ts,
// StoredBranding): quien administra puede subir algo puntual ("estamos de
// mudanza", un aviso con su propio diseño, etc.) sin tocar la marca
// habitual de la institucion.
export async function subirImagenMantenimiento(formData: FormData) {
  const token = await requireAccessToken();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    redirect(`${PATH}?error=${encodeURIComponent('Elige una imagen para el fondo.')}`);
  }

  const uploadForm = new FormData();
  uploadForm.append('file', file);

  try {
    await apiFetchUpload(token, '/tenant/maintenance-image', uploadForm);
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  revalidatePath('/');
  redirect(`${PATH}?saved=1`);
}

export async function quitarImagenMantenimiento() {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, '/tenant/maintenance-image', { method: 'DELETE' });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  revalidatePath('/');
  redirect(`${PATH}?saved=1`);
}
