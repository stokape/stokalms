'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';

const PATH = '/configuracion-marca';

export async function actualizarMarca(formData: FormData) {
  const token = await requireAccessToken();

  const name = String(formData.get('name') ?? '').trim();
  const logoUrl = String(formData.get('logoUrl') ?? '').trim();
  const backgroundColor = String(formData.get('backgroundColor') ?? '').trim();
  const backgroundImageUrl = String(formData.get('backgroundImageUrl') ?? '').trim();

  try {
    await apiFetch(token, '/tenant', {
      method: 'PATCH',
      body: JSON.stringify({
        name,
        branding: {
          ...(logoUrl && { logoUrl }),
          ...(backgroundColor && { backgroundColor }),
          ...(backgroundImageUrl && { backgroundImageUrl }),
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
