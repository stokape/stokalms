// ============================================================================
// admin-plataforma/instituciones/nueva/page.tsx — Alta DIRECTA de una
// institución por un administrador de plataforma, sin pasar por el
// formulario público + aprobación (ver la nota grande en
// tenant-registration.service.ts). Protegida como el resto de
// admin-plataforma: cada acción llama a "requireAccessToken" y el backend
// corta con 403 (PlatformAdminGuard) si la cuenta no está en
// PLATFORM_ADMIN_EMAILS.
// ============================================================================

import Link from 'next/link';
import { headers } from 'next/headers';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorBanner } from '@/components/ErrorBanner';
import { requireAccessToken } from '@/lib/api';
import { getLocale } from '@/lib/locale';
import { crearInstitucionDirecta } from './actions';
import { DirectCreateForm } from './DirectCreateForm';

const TEXT = {
  es: {
    title: 'Crear institución directamente',
    descriptionPrefix: 'Se crea (y se aprueba) de una — con su dominio y su cuenta de Keycloak listos, sin pasar por el formulario público.',
    backToRequests: 'Volver a solicitudes',
  },
  en: {
    title: 'Create institution directly',
    descriptionPrefix: "It's created (and approved) right away — with its domain and Keycloak account ready, without going through the public form.",
    backToRequests: 'Back to requests',
  },
};

export default async function NuevaInstitucionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAccessToken();
  const [{ error }, hostHeader, locale] = await Promise.all([
    searchParams,
    headers().then((h) => h.get('host') ?? ''),
    getLocale(),
  ]);
  const [rootHostname] = hostHeader.split(':');
  const t = TEXT[locale];

  return (
    <div className="mx-auto max-w-lg px-6">
      <PageHeader
        title={t.title}
        description={
          <>
            {t.descriptionPrefix}{' '}
            <Link href="/admin-plataforma/solicitudes" className="text-primary hover:underline">
              {t.backToRequests}
            </Link>
          </>
        }
      />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      <DirectCreateForm action={crearInstitucionDirecta} rootHostname={rootHostname} locale={locale} />
    </div>
  );
}
