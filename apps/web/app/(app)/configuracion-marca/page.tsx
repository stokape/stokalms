// ============================================================================
// configuracion-marca/page.tsx — Nombre y marca (logo, fondo) de la
// institucion, tal como se ven en su "home" publico (ver app/page.tsx)
// ANTES de iniciar sesion. Requiere "tenant:edit" (Administrador de
// entidad / Super Admin, ver prisma/seed.js) — cualquier otro rol ve el
// mensaje de "no tienes permiso" habitual.
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { actualizarMarca } from './actions';

interface Tenant {
  name: string;
  branding: {
    logoUrl?: string;
    backgroundColor?: string;
    backgroundImageUrl?: string;
  };
}

export default async function ConfiguracionMarcaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const token = await requireAccessToken();

  let tenant: Tenant;
  try {
    tenant = await apiFetch<Tenant>(token, '/tenant');
  } catch (err) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorBanner message={toErrorMessage(err)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Configuración de marca</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Esto es lo que ve cualquier persona en el &quot;home&quot; público de tu institución, antes de
        iniciar sesión. Después de guardar, abrí{' '}
        <a href="/" target="_blank" className="underline">
          la página de inicio
        </a>{' '}
        en otra pestaña para ver el resultado.
      </p>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}
      {saved && (
        <p className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Los cambios se guardaron correctamente.
        </p>
      )}

      <form action={actualizarMarca} className="flex max-w-md flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Nombre de la institución
          <input
            name="name"
            type="text"
            required
            defaultValue={tenant.name}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          URL del logo
          <input
            name="logoUrl"
            type="text"
            defaultValue={tenant.branding.logoUrl ?? ''}
            placeholder="https://..."
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Color de fondo
          <input
            name="backgroundColor"
            type="text"
            defaultValue={tenant.branding.backgroundColor ?? ''}
            placeholder="#0f172a"
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <span className="text-xs text-zinc-500">
            Un color hexadecimal (ej. &quot;#0f172a&quot;). Si además cargás una imagen de fondo, la
            imagen tiene prioridad.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          URL de imagen de fondo (opcional)
          <input
            name="backgroundImageUrl"
            type="text"
            defaultValue={tenant.branding.backgroundImageUrl ?? ''}
            placeholder="https://..."
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <button
          type="submit"
          className="mt-2 self-start rounded-full bg-foreground px-6 py-3 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
