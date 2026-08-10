// ============================================================================
// perfil/page.tsx — "Mi perfil": datos personales, más la foto (que
// cualquiera puede cambiar de sí mismo) y la fecha de inscripción.
//
// El resto de los datos (nombre, apellido, teléfono, dirección,
// departamento/provincia/distrito) son de SOLO LECTURA para la mayoría de
// los roles — se completan por otra vía (ver la nota extensa en
// profile.service.ts, backend) — PERO alguien con "user_profile:edit" (hoy
// Coordinador académico y Administrador de entidad, ver prisma/seed.js) ya
// puede editar el perfil de CUALQUIERA en su tenant (ver
// usuarios/[userTenantId]/perfil/page.tsx): a esa misma persona no tendría
// sentido bloquearle editar el SUYO propio, así que se le ofrece el mismo
// formulario aquí, apuntado a su propia membresía.
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage, getPermissions, can } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { fileInputClasses } from '@/components/ui/field-styles';
import { getLocale } from '@/lib/locale';
import { actualizarFoto, actualizarMiPerfil } from './actions';

interface Profile {
  userTenantId: string;
  email: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  department: string | null;
  province: string | null;
  district: string | null;
  avatarUrl: string | null;
  enrolledAt: string;
}

const TEXT = {
  es: {
    title: 'Mi perfil',
    updated: 'Perfil actualizado.',
    uploadPhoto: 'Subir foto',
    personalData: 'Datos personales',
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo electrónico',
    phone: 'Número de contacto',
    address: 'Dirección',
    department: 'Departamento',
    province: 'Provincia',
    district: 'Distrito',
    enrolledOn: 'Fecha de inscripción',
    saveChanges: 'Guardar cambios',
    readOnlyNote: 'Estos datos son de solo lectura desde aquí — si alguno está mal o incompleto, pídele a quien administra tu institución que lo corrija.',
    unspecified: 'No especificado',
  },
  en: {
    title: 'My profile',
    updated: 'Profile updated.',
    uploadPhoto: 'Upload photo',
    personalData: 'Personal data',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    phone: 'Contact number',
    address: 'Address',
    department: 'Department',
    province: 'Province',
    district: 'District',
    enrolledOn: 'Enrollment date',
    saveChanges: 'Save changes',
    readOnlyNote: "This data is read-only from here — if anything is wrong or incomplete, ask whoever manages your institution to correct it.",
    unspecified: 'Not specified',
  },
};

function campo(label: string, value: string | null, unspecified: string) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5">{value || <span className="text-muted/60">{unspecified}</span>}</dd>
    </div>
  );
}

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const token = await requireAccessToken();
  const locale = await getLocale();
  const t = TEXT[locale];

  let profile: Profile;
  try {
    profile = await apiFetch<Profile>(token, '/profile');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  const permissions = await getPermissions(token);
  const canEditOwnData = can(permissions, 'user_profile', 'edit');

  return (
    <div>
      <PageHeader title={t.title} />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}
      {ok && (
        <Card className="mb-6 border-success/30 bg-success-bg text-sm text-success">
          {t.updated}
        </Card>
      )}

      <Card className="mb-6 flex flex-wrap items-center gap-6">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal, no un asset estatico.
          <img
            src={profile.avatarUrl}
            alt={profile.fullName}
            className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/20"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
            {profile.fullName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="mb-2 font-medium">{profile.fullName}</p>
          <form action={actualizarFoto} className="flex flex-wrap items-center gap-2">
            <input name="file" type="file" accept="image/*" required className={fileInputClasses} />
            <Button type="submit" variant="secondary" size="sm">
              {t.uploadPhoto}
            </Button>
          </form>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-medium">{t.personalData}</h2>

        {canEditOwnData ? (
          <form
            action={actualizarMiPerfil.bind(null, profile.userTenantId)}
            className="grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <Field label={t.firstName} name="firstName" defaultValue={profile.firstName ?? ''} />
            <Field label={t.lastName} name="lastName" defaultValue={profile.lastName ?? ''} />
            <div>
              <dt className="text-xs text-muted">{t.email}</dt>
              <dd className="mt-0.5">{profile.email}</dd>
            </div>
            <Field label={t.phone} name="phone" defaultValue={profile.phone ?? ''} />
            <Field
              label={t.address}
              name="address"
              defaultValue={profile.address ?? ''}
              className="sm:col-span-2"
            />
            <Field label={t.department} name="department" defaultValue={profile.department ?? ''} />
            <Field label={t.province} name="province" defaultValue={profile.province ?? ''} />
            <Field label={t.district} name="district" defaultValue={profile.district ?? ''} />
            <div>
              <dt className="text-xs text-muted">{t.enrolledOn}</dt>
              <dd className="mt-0.5">
                {new Date(profile.enrolledAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-PE', { dateStyle: 'long' })}
              </dd>
            </div>
            <Button type="submit" className="self-start sm:col-span-2">
              {t.saveChanges}
            </Button>
          </form>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted">{t.readOnlyNote}</p>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {campo(t.firstName, profile.firstName, t.unspecified)}
              {campo(t.lastName, profile.lastName, t.unspecified)}
              {campo(t.email, profile.email, t.unspecified)}
              {campo(t.phone, profile.phone, t.unspecified)}
              {campo(t.address, profile.address, t.unspecified)}
              {campo(t.department, profile.department, t.unspecified)}
              {campo(t.province, profile.province, t.unspecified)}
              {campo(t.district, profile.district, t.unspecified)}
              <div>
                <dt className="text-xs text-muted">{t.enrolledOn}</dt>
                <dd className="mt-0.5">
                  {new Date(profile.enrolledAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-PE', { dateStyle: 'long' })}
                </dd>
              </div>
            </dl>
          </>
        )}
      </Card>
    </div>
  );
}
