// ============================================================================
// perfil/page.tsx — "Mi perfil": datos personales de SOLO LECTURA (nombre,
// apellido, email, teléfono, dirección, departamento/provincia/distrito,
// fecha de inscripción) más la ÚNICA cosa que cada quien puede editar de sí
// mismo desde acá: su foto. El resto de los datos hoy se completan por otra
// vía (ver la nota extensa en profile.service.ts, backend) — mostrarlos acá
// sin poder editarlos es intencional, no un olvido.
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { actualizarFoto } from './actions';

interface Profile {
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

function campo(label: string, value: string | null) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd>{value || <span className="text-zinc-400">No especificado</span>}</dd>
    </div>
  );
}

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const token = await requireAccessToken();

  let profile: Profile;
  try {
    profile = await apiFetch<Profile>(token, '/profile');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold">Mi perfil</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      <div className="mb-8 flex items-center gap-6">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal, no un asset estatico.
          <img
            src={profile.avatarUrl}
            alt={profile.fullName}
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-200 text-2xl text-zinc-500 dark:bg-zinc-800">
            {profile.fullName.charAt(0).toUpperCase()}
          </div>
        )}
        <form action={actualizarFoto} className="flex flex-col gap-2">
          <label className="text-sm font-medium">Cambiar foto</label>
          <input name="file" type="file" accept="image/*" required className="text-sm" />
          <button
            type="submit"
            className="self-start rounded-full bg-foreground px-4 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Subir foto
          </button>
        </form>
      </div>

      <h2 className="mb-3 text-lg font-medium">Datos personales</h2>
      <p className="mb-4 text-sm text-zinc-500">
        Estos datos son de solo lectura desde acá — si alguno está mal o incompleto, pedile a quien
        administra tu institución que lo corrija.
      </p>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {campo('Nombre', profile.firstName)}
        {campo('Apellido', profile.lastName)}
        {campo('Correo electrónico', profile.email)}
        {campo('Número de contacto', profile.phone)}
        {campo('Dirección', profile.address)}
        {campo('Departamento', profile.department)}
        {campo('Provincia', profile.province)}
        {campo('Distrito', profile.district)}
        <div>
          <dt className="text-xs text-zinc-500">Fecha de inscripción</dt>
          <dd>{new Date(profile.enrolledAt).toLocaleDateString('es-PE', { dateStyle: 'long' })}</dd>
        </div>
      </dl>
    </div>
  );
}
