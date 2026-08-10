// ============================================================================
// usuarios/[userTenantId]/perfil/page.tsx — Editar el perfil de OTRA
// persona (datos de contacto/residencia) — distinto de "/perfil" (ver
// app/(app)/perfil/page.tsx), que es de SOLO LECTURA y siempre sobre uno
// mismo. Esta pantalla requiere "user_profile:edit" (Coordinador académico,
// Administrador) y llega normalmente desde la lista de matriculados de una
// sección (ver secciones/[sectionId]/page.tsx).
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Button } from '@/components/ui/Button';
import { getLocale } from '@/lib/locale';
import { actualizarPerfilDeAlumno } from './actions';

const TEXT = {
  es: {
    title: 'Editar perfil',
    updated: 'Perfil actualizado.',
    firstName: 'Nombre',
    lastName: 'Apellido',
    phone: 'Número de contacto',
    address: 'Dirección',
    department: 'Departamento',
    province: 'Provincia',
    district: 'Distrito',
    saveChanges: 'Guardar cambios',
  },
  en: {
    title: 'Edit profile',
    updated: 'Profile updated.',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Contact number',
    address: 'Address',
    department: 'Department',
    province: 'Province',
    district: 'District',
    saveChanges: 'Save changes',
  },
};

interface StaffEditableProfile {
  email: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  department: string | null;
  province: string | null;
  district: string | null;
}

export default async function EditarPerfilDeAlumnoPage({
  params,
  searchParams,
}: {
  params: Promise<{ userTenantId: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { userTenantId } = await params;
  const { error, ok } = await searchParams;
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];

  let profile: StaffEditableProfile;
  try {
    profile = await apiFetch<StaffEditableProfile>(token, `/users/${userTenantId}/profile`);
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold">{t.title}</h1>
      <p className="mb-6 text-sm text-zinc-500">{profile.fullName} · {profile.email}</p>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}
      {ok && (
        <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          {t.updated}
        </div>
      )}

      <form
        action={actualizarPerfilDeAlumno.bind(null, userTenantId)}
        className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <label className="text-xs text-zinc-500">
          {t.firstName}
          <input
            name="firstName"
            type="text"
            defaultValue={profile.firstName ?? ''}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-xs text-zinc-500">
          {t.lastName}
          <input
            name="lastName"
            type="text"
            defaultValue={profile.lastName ?? ''}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-xs text-zinc-500">
          {t.phone}
          <input
            name="phone"
            type="text"
            defaultValue={profile.phone ?? ''}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-xs text-zinc-500 sm:col-span-2">
          {t.address}
          <input
            name="address"
            type="text"
            defaultValue={profile.address ?? ''}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-xs text-zinc-500">
          {t.department}
          <input
            name="department"
            type="text"
            defaultValue={profile.department ?? ''}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-xs text-zinc-500">
          {t.province}
          <input
            name="province"
            type="text"
            defaultValue={profile.province ?? ''}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-xs text-zinc-500">
          {t.district}
          <input
            name="district"
            type="text"
            defaultValue={profile.district ?? ''}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <Button type="submit" className="self-start sm:col-span-2">
          {t.saveChanges}
        </Button>
      </form>
    </div>
  );
}
