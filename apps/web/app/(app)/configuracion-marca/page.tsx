// ============================================================================
// configuracion-marca/page.tsx — Nombre y marca (logo, fondo) de la
// institucion, tal como se ven en su "home" publico (ver app/page.tsx)
// ANTES de iniciar sesion. Requiere "tenant:edit" (Administrador de
// entidad / Super Admin, ver prisma/seed.js) — cualquier otro rol ve el
// mensaje de "no tienes permiso" habitual.
//
// El logo y la imagen de fondo se SUBEN como archivo real (mismo patron
// que la foto de perfil, ver profile/page.tsx) — no se pegan como URL a
// mano. El color de fondo si sigue siendo un campo de texto simple: es el
// respaldo que se usa cuando todavia no se subio una imagen de fondo (o
// si la institucion prefiere un fondo solido en vez de una foto), no un
// archivo que subir.
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuccessBanner } from '@/components/SuccessBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { getLocale } from '@/lib/locale';
import { actualizarMarca, actualizarLogo, actualizarFondo, actualizarFavicon } from './actions';
import { BrandingStudio } from './BrandingStudio';

const TEXT = {
  es: {
    title: 'Configuración de marca',
    descriptionPrefix: 'Esto es lo que ve cualquier persona en el "home" público de tu institución, antes de iniciar sesión.',
    viewHome: 'Ver la página de inicio →',
    saved: 'Los cambios se guardaron correctamente.',
  },
  en: {
    title: 'Branding settings',
    descriptionPrefix: "This is what anyone sees on your institution's public \"home\" page, before logging in.",
    viewHome: 'View the home page →',
    saved: 'Your changes were saved successfully.',
  },
};

interface Tenant {
  name: string;
  branding: {
    logoUrl?: string;
    backgroundColor?: string;
    backgroundImageUrl?: string;
    primaryColor?: string;
    faviconUrl?: string;
    hideStokaBranding?: boolean;
  };
}

export default async function ConfiguracionMarcaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const token = await requireAccessToken();
  const locale = await getLocale();
  const t = TEXT[locale];

  let tenant: Tenant;
  try {
    tenant = await apiFetch<Tenant>(token, '/tenant');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  return (
    <div>
      <PageHeader
        title={t.title}
        description={
          <>
            {t.descriptionPrefix}{' '}
            <a href="/" target="_blank" className="text-primary hover:underline">
              {t.viewHome}
            </a>
          </>
        }
      />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}
      {saved && (
        <SuccessBanner>{t.saved}</SuccessBanner>
      )}

      <BrandingStudio
        tenantName={tenant.name}
        initialColor={tenant.branding.backgroundColor ?? '#1e90ff'}
        initialPrimaryColor={tenant.branding.primaryColor ?? '#1e90ff'}
        initialLogoUrl={tenant.branding.logoUrl}
        initialBackgroundUrl={tenant.branding.backgroundImageUrl}
        initialFaviconUrl={tenant.branding.faviconUrl}
        initialHideStokaBranding={tenant.branding.hideStokaBranding ?? false}
        actualizarMarca={actualizarMarca}
        actualizarLogo={actualizarLogo}
        actualizarFondo={actualizarFondo}
        actualizarFavicon={actualizarFavicon}
        locale={locale}
      />
    </div>
  );
}
