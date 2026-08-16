'use server';

// ============================================================================
// admin-plataforma/instituciones/[tenantId]/actions.ts — Todo lo que se
// puede hacer desde el detalle de UNA institucion: activar/desactivar,
// dominios (mismo flujo TXT que (app)/dominios/actions.ts, pero apuntando a
// "/platform/tenants/:tenantId/domains" en vez de "/tenant/domains") y
// roles (mismo flujo que (app)/usuarios/actions.ts, apuntando a
// "/platform/tenants/:tenantId/members/...").
// ============================================================================

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, apiFetchUpload, toErrorMessage } from '@/lib/api';

const path = (tenantId: string) => `/admin-plataforma/instituciones/${tenantId}`;

export async function cambiarEstadoInstitucion(tenantId: string, active: boolean) {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/platform/tenants/${tenantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  } catch (err) {
    redirect(`${path(tenantId)}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path(tenantId));
  redirect(path(tenantId));
}

export async function cambiarPlanInstitucion(tenantId: string, formData: FormData) {
  const token = await requireAccessToken();
  const plan = String(formData.get('plan') ?? '');

  try {
    await apiFetch(token, `/platform/tenants/${tenantId}/plan`, {
      method: 'PATCH',
      body: JSON.stringify({ plan }),
    });
  } catch (err) {
    redirect(`${path(tenantId)}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path(tenantId));
  revalidatePath('/admin-plataforma/instituciones');
  redirect(`${path(tenantId)}?saved=1`);
}

export async function agregarDominio(tenantId: string, formData: FormData) {
  const token = await requireAccessToken();
  const domain = String(formData.get('domain') ?? '').trim();

  try {
    await apiFetch(token, `/platform/tenants/${tenantId}/domains`, {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  } catch (err) {
    redirect(`${path(tenantId)}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path(tenantId));
  redirect(`${path(tenantId)}?saved=1`);
}

export async function verificarDominio(tenantId: string, domainId: string) {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/platform/tenants/${tenantId}/domains/${domainId}/verify`, { method: 'PATCH' });
  } catch (err) {
    redirect(`${path(tenantId)}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path(tenantId));
  redirect(`${path(tenantId)}?saved=1`);
}

export async function eliminarDominio(tenantId: string, domainId: string) {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/platform/tenants/${tenantId}/domains/${domainId}`, { method: 'DELETE' });
  } catch (err) {
    redirect(`${path(tenantId)}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path(tenantId));
  redirect(`${path(tenantId)}?saved=1`);
}

export async function asignarRol(tenantId: string, userTenantId: string, formData: FormData) {
  const token = await requireAccessToken();
  const roleId = String(formData.get('roleId') ?? '');
  const scopeCourseId = String(formData.get('scopeCourseId') ?? '').trim() || undefined;

  try {
    await apiFetch(token, `/platform/tenants/${tenantId}/members/${userTenantId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roleId, scopeCourseId }),
    });
  } catch (err) {
    redirect(`${path(tenantId)}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path(tenantId));
  redirect(path(tenantId));
}

export async function quitarRol(tenantId: string, userTenantId: string, userRoleId: string) {
  const token = await requireAccessToken();

  try {
    await apiFetch(
      token,
      `/platform/tenants/${tenantId}/members/${userTenantId}/roles/${userRoleId}`,
      { method: 'DELETE' },
    );
  } catch (err) {
    redirect(`${path(tenantId)}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path(tenantId));
  redirect(path(tenantId));
}

// --- Marca (nombre, colores, logo, fondo, favicon) ----------------------
// Mismo flujo que (app)/configuracion-marca/actions.ts, apuntando a
// "/platform/tenants/:tenantId/branding" en vez de "/tenant" — ver la nota
// extensa en platform-tenants.service.ts sobre por que esto reusa la MISMA
// logica del backend que el autoservicio, solo que con el tenantId de la URL.

export async function actualizarMarcaInstitucion(tenantId: string, formData: FormData) {
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
    redirect(`${path(tenantId)}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path(tenantId));
  revalidatePath('/admin-plataforma/instituciones');
  redirect(`${path(tenantId)}?saved=1`);
}

async function subirImagenInstitucion(tenantId: string, endpoint: string, formData: FormData, campoVacio: string) {
  const token = await requireAccessToken();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    redirect(`${path(tenantId)}?error=${encodeURIComponent(campoVacio)}`);
  }

  const uploadForm = new FormData();
  uploadForm.append('file', file);

  try {
    await apiFetchUpload(token, `/platform/tenants/${tenantId}/${endpoint}`, uploadForm);
  } catch (err) {
    redirect(`${path(tenantId)}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path(tenantId));
  redirect(`${path(tenantId)}?saved=1`);
}

export async function subirLogoInstitucion(tenantId: string, formData: FormData) {
  return subirImagenInstitucion(tenantId, 'logo', formData, 'Elige una imagen para el logo.');
}

export async function subirFondoInstitucion(tenantId: string, formData: FormData) {
  return subirImagenInstitucion(tenantId, 'background-image', formData, 'Elige una imagen para el fondo.');
}

export async function subirFaviconInstitucion(tenantId: string, formData: FormData) {
  return subirImagenInstitucion(tenantId, 'favicon', formData, 'Elige una imagen para el favicon.');
}

// --- Mantenimiento --------------------------------------------------------
// Mismo flujo que (app)/mantenimiento/actions.ts, apuntando al mismo
// "branding" cross-tenant de arriba.

export async function guardarMantenimientoInstitucion(tenantId: string, formData: FormData) {
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
    redirect(`${path(tenantId)}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path(tenantId));
  revalidatePath('/admin-plataforma/instituciones');
  redirect(`${path(tenantId)}?saved=1`);
}

export async function subirImagenMantenimientoInstitucion(tenantId: string, formData: FormData) {
  return subirImagenInstitucion(
    tenantId,
    'maintenance-image',
    formData,
    'Elige una imagen para el aviso de mantenimiento.',
  );
}

export async function quitarImagenMantenimientoInstitucion(tenantId: string) {
  const token = await requireAccessToken();

  try {
    await apiFetch(token, `/platform/tenants/${tenantId}/maintenance-image`, { method: 'DELETE' });
  } catch (err) {
    redirect(`${path(tenantId)}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(path(tenantId));
  redirect(`${path(tenantId)}?saved=1`);
}
