'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, apiFetchUpload, toErrorMessage } from '@/lib/api';

const PATH = '/configuracion-marca';

// Nombre + color de fondo (respaldo) + color de marca (botones/links en
// TODA la app, ver apps/web/app/layout.tsx) — el logo, la imagen de fondo
// y el favicon se suben aparte, como archivo real (ver
// actualizarLogo/actualizarFondo/actualizarFavicon más abajo), no aquí.
export async function actualizarMarca(formData: FormData) {
  const token = await requireAccessToken();

  const name = String(formData.get('name') ?? '').trim();
  const backgroundColor = String(formData.get('backgroundColor') ?? '').trim();
  const primaryColor = String(formData.get('primaryColor') ?? '').trim();
  // A diferencia de los colores (string vacio = "no tocar"), un checkbox
  // desmarcado simplemente NO aparece en el FormData — por eso esto se
  // manda siempre, explicito, para que desmarcarlo efectivamente vuelva a
  // mostrar el sello (ver mismo criterio en automatizaciones/actions.ts).
  const hideStokaBranding = formData.get('hideStokaBranding') === 'on';

  try {
    await apiFetch(token, '/tenant', {
      method: 'PATCH',
      body: JSON.stringify({
        name,
        branding: {
          ...(backgroundColor && { backgroundColor }),
          ...(primaryColor && { primaryColor }),
          hideStokaBranding,
        },
      }),
    });
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  revalidatePath('/');
  redirect(`${PATH}?saved=1`);
}

export async function actualizarLogo(formData: FormData) {
  const token = await requireAccessToken();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    redirect(`${PATH}?error=${encodeURIComponent('Elige una imagen para el logo.')}`);
  }

  const uploadForm = new FormData();
  uploadForm.append('file', file);

  try {
    await apiFetchUpload(token, '/tenant/logo', uploadForm);
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  revalidatePath('/');
  redirect(`${PATH}?saved=1`);
}

export async function actualizarFondo(formData: FormData) {
  const token = await requireAccessToken();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    redirect(`${PATH}?error=${encodeURIComponent('Elige una imagen para el fondo.')}`);
  }

  const uploadForm = new FormData();
  uploadForm.append('file', file);

  try {
    await apiFetchUpload(token, '/tenant/background-image', uploadForm);
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  revalidatePath('/');
  redirect(`${PATH}?saved=1`);
}

// Favicon propio de la institucion — cae al de Stoka si no se subio
// ninguno (ver apps/web/app/layout.tsx, "generateMetadata").
export async function actualizarFavicon(formData: FormData) {
  const token = await requireAccessToken();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    redirect(`${PATH}?error=${encodeURIComponent('Elige una imagen para el favicon.')}`);
  }

  const uploadForm = new FormData();
  uploadForm.append('file', file);

  try {
    await apiFetchUpload(token, '/tenant/favicon', uploadForm);
  } catch (err) {
    redirect(`${PATH}?error=${encodeURIComponent(toErrorMessage(err))}`);
  }

  revalidatePath(PATH);
  revalidatePath('/');
  redirect(`${PATH}?saved=1`);
}
