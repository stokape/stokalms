'use server';

// ============================================================================
// admin-plataforma/instituciones/[tenantId]/actions.ts — Todo lo que se
// puede hacer desde el detalle de UNA institucion: activar/desactivar,
// cambiar el plan, dominios (mismo flujo TXT que (app)/dominios/actions.ts,
// pero apuntando a "/platform/tenants/:tenantId/domains" en vez de
// "/tenant/domains") y roles (mismo flujo que (app)/usuarios/actions.ts,
// apuntando a "/platform/tenants/:tenantId/members/...").
//
// NINGUNA llama a redirect() (ver la nota extensa en periodos/actions.ts):
// todas se quedan en esta misma pantalla, asi que devuelven un ActionState
// que InstitucionForms.tsx consume con useActionState, y revalidatePath
// alcanza para reflejar el cambio sin navegar a ningun lado.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, apiFetchUpload, toErrorMessage } from '@/lib/api';
type ActionState = { error: string | null; saved?: boolean };

const path = (tenantId: string) => `/admin-plataforma/instituciones/${tenantId}`;

export async function cambiarEstadoInstitucion(
  tenantId: string,
  active: boolean,
  _prevState: ActionState,
): Promise<ActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/platform/tenants/${tenantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(path(tenantId));
  return { error: null };
}

export async function cambiarPlanInstitucion(
  tenantId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const plan = String(formData.get('plan') ?? '');

  try {
    await apiFetch(token, `/platform/tenants/${tenantId}/plan`, {
      method: 'PATCH',
      body: JSON.stringify({ plan }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(path(tenantId));
  return { error: null, saved: true };
}

export async function agregarDominio(
  tenantId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const domain = String(formData.get('domain') ?? '').trim();

  try {
    await apiFetch(token, `/platform/tenants/${tenantId}/domains`, {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(path(tenantId));
  return { error: null, saved: true };
}

export async function verificarDominio(
  tenantId: string,
  domainId: string,
  _prevState: ActionState,
): Promise<ActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/platform/tenants/${tenantId}/domains/${domainId}/verify`, { method: 'PATCH' });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(path(tenantId));
  return { error: null, saved: true };
}

export async function eliminarDominio(
  tenantId: string,
  domainId: string,
  _prevState: ActionState,
): Promise<ActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/platform/tenants/${tenantId}/domains/${domainId}`, { method: 'DELETE' });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(path(tenantId));
  return { error: null, saved: true };
}

export async function asignarRol(
  tenantId: string,
  userTenantId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const roleId = String(formData.get('roleId') ?? '');
  const scopeCourseId = String(formData.get('scopeCourseId') ?? '').trim() || undefined;

  try {
    await apiFetch(token, `/platform/tenants/${tenantId}/members/${userTenantId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roleId, scopeCourseId }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(path(tenantId));
  return { error: null };
}

export async function quitarRol(
  tenantId: string,
  userTenantId: string,
  userRoleId: string,
  _prevState: ActionState,
): Promise<ActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(
      token,
      `/platform/tenants/${tenantId}/members/${userTenantId}/roles/${userRoleId}`,
      { method: 'DELETE' },
    );
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(path(tenantId));
  return { error: null };
}

// --- Marca (nombre, colores, logo, fondo, favicon) ----------------------
// Mismo flujo que (app)/configuracion-marca/actions.ts, apuntando a
// "/platform/tenants/:tenantId/branding" en vez de "/tenant" — ver la nota
// extensa en platform-tenants.service.ts sobre por que esto reusa la MISMA
// logica del backend que el autoservicio, solo que con el tenantId de la URL.

export async function actualizarMarcaInstitucion(
  tenantId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();

  const name = String(formData.get('name') ?? '').trim();
  const backgroundColor = String(formData.get('backgroundColor') ?? '').trim();
  const primaryColor = String(formData.get('primaryColor') ?? '').trim();

  try {
    await apiFetch(token, `/platform/tenants/${tenantId}/branding`, {
      method: 'PATCH',
      body: JSON.stringify({
        name,
        branding: {
          ...(backgroundColor && { backgroundColor }),
          ...(primaryColor && { primaryColor }),
        },
      }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(path(tenantId));
  return { error: null, saved: true };
}

async function subirImagenInstitucion(
  tenantId: string,
  endpoint: string,
  formData: FormData,
  campoVacio: string,
): Promise<ActionState> {
  const token = await requireAccessToken();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    return { error: campoVacio };
  }

  const uploadForm = new FormData();
  uploadForm.append('file', file);

  try {
    await apiFetchUpload(token, `/platform/tenants/${tenantId}/${endpoint}`, uploadForm);
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(path(tenantId));
  return { error: null, saved: true };
}

export async function subirLogoInstitucion(
  tenantId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return subirImagenInstitucion(tenantId, 'logo', formData, 'Elige una imagen para el logo.');
}

export async function subirFondoInstitucion(
  tenantId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return subirImagenInstitucion(tenantId, 'background-image', formData, 'Elige una imagen para el fondo.');
}

export async function subirFaviconInstitucion(
  tenantId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return subirImagenInstitucion(tenantId, 'favicon', formData, 'Elige una imagen para el favicon.');
}

// --- Mantenimiento --------------------------------------------------------
// Mismo flujo que (app)/mantenimiento/actions.ts, apuntando al mismo
// "branding" cross-tenant de arriba.

export async function guardarMantenimientoInstitucion(
  tenantId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await requireAccessToken();

  const maintenanceMode = formData.get('maintenanceMode') === 'on';
  const maintenanceMessage = String(formData.get('maintenanceMessage') ?? '').trim();
  const rawEndsAt = String(formData.get('maintenanceEndsAt') ?? '').trim();
  const maintenanceEndsAt = rawEndsAt ? new Date(rawEndsAt).toISOString() : '';

  try {
    await apiFetch(token, `/platform/tenants/${tenantId}/branding`, {
      method: 'PATCH',
      body: JSON.stringify({ maintenanceMode, maintenanceMessage, maintenanceEndsAt }),
    });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(path(tenantId));
  return { error: null, saved: true };
}

export async function subirImagenMantenimientoInstitucion(
  tenantId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return subirImagenInstitucion(
    tenantId,
    'maintenance-image',
    formData,
    'Elige una imagen para el aviso de mantenimiento.',
  );
}

export async function quitarImagenMantenimientoInstitucion(
  tenantId: string,
  _prevState: ActionState,
): Promise<ActionState> {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/platform/tenants/${tenantId}/maintenance-image`, { method: 'DELETE' });
  } catch (err) {
    return { error: toErrorMessage(err) };
  }

  revalidatePath(path(tenantId));
  return { error: null, saved: true };
}
