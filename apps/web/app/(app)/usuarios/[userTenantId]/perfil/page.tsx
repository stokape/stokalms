// ============================================================================
// usuarios/[userTenantId]/perfil/page.tsx — Editar el perfil de OTRA
// persona (datos de contacto/residencia) — distinto de "/perfil" (ver
// app/(app)/perfil/page.tsx), que es de SOLO LECTURA y siempre sobre uno
// mismo. Esta pantalla requiere "user_profile:edit" (Coordinador académico,
// Administrador) y llega normalmente desde la lista de matriculados de una
// sección (ver secciones/[sectionId]/page.tsx).
//
// El formulario vive en PerfilForm.tsx (Client Component) A PROPOSITO --
// ver la nota extensa en periodos/actions.ts: la Server Action ya NO llama
// a redirect(), necesita useActionState (solo disponible del lado del
// cliente).
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { getLocale } from '@/lib/locale';
import { PerfilForm } from './PerfilForm';

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
    saving: 'Guardando…',
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
    saving: 'Saving…',
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
}: {
  params: Promise<{ userTenantId: string }>;
}) {
  const { userTenantId } = await params;
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

      <PerfilForm userTenantId={userTenantId} profile={profile} t={t} />
    </div>
  );
}
