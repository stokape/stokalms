'use server';

// ============================================================================
// mantenimiento/actions.ts — Prender/apagar el modo mantenimiento, subir/
// quitar la imagen de fondo del aviso. NINGUNA llama a redirect() (ver la
// nota extensa en periodos/actions.ts): devuelven un estado que
// MantenimientoForms.tsx consume con useActionState.
//
// El home publico y el resto de la app (ver app/page.tsx y (app)/layout.tsx)
// leen "maintenanceMode" en cada visita: revalidatePath('/', 'layout')
// invalida TODO el arbol, no solo esta pantalla.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, apiFetchUpload, toErrorMessage } from '@/lib/api';

export type MantenimientoActionState = { error: string | null; saved?: boolean };

function invalidateEverything() {
  revalidatePath('/', 'layout');
}

// Un unico formulario (ver page.tsx) prende/apaga el modo mantenimiento Y
// guarda el mensaje/fecha en el mismo envio — separarlo en dos acciones
// (una para el switch, otra para el texto) solo agregaba un paso extra sin
// ningun beneficio real.
export async function guardarMantenimiento(
  _prevState: MantenimientoActionState,
  formData: FormData,
): Promise<MantenimientoActionState> {
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
    return { error: toErrorMessage(err) };
  }

  invalidateEverything();
  return { error: null, saved: true };
}

// Imagen de fondo del landing de mantenimiento — libre, no tiene que ser la
// misma que el fondo de todos los dias (ver la nota en tenant.service.ts,
// StoredBranding): quien administra puede subir algo puntual ("estamos de
// mudanza", un aviso con su propio diseño, etc.) sin tocar la marca
// habitual de la institucion.
export async function subirImagenMantenimiento(
  _prevState: MantenimientoActionState,
  formData: FormData,
): Promise<MantenimientoActionState> {
  const token = await requireAccessToken();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Elige una imagen para el fondo.' };
  }

  const uploadForm = new FormData();
  uploadForm.append('file', file);

  try {
    await apiFetchUpload(token, '/tenant/maintenance-image', uploadForm);
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  invalidateEverything();
  return { error: null, saved: true };
}

export async function quitarImagenMantenimiento(
  _prevState: MantenimientoActionState,
): Promise<MantenimientoActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, '/tenant/maintenance-image', { method: 'DELETE' });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  invalidateEverything();
  return { error: null, saved: true };
}
