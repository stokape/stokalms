// ============================================================================
// registro-institucion/page.tsx — Formulario PUBLICO de alta de una
// institucion nueva. Crea una SOLICITUD (ver
// apps/api/src/modules/tenant-registration/), no un tenant directo: queda
// pendiente de que un administrador de plataforma la revise (ver
// admin-plataforma/solicitudes/page.tsx) — no es autoservicio instantaneo.
//
// Los campos viven en RegistrationForm.tsx (Client Component): el
// subdominio se autosugiere a partir del nombre a medida que se escribe,
// algo que este Server Component no puede hacer por si solo.
//
// "?plan=..." (ver app/precios/actions.ts): cuando se llega desde el CTA
// de un plan en /precios, cambia el subtitulo y precarga el mensaje — el
// resto del formulario (y el endpoint al que se manda) es EXACTAMENTE el
// mismo. Para el plan Enterprise en particular, este formulario ES el
// "contactar con ventas" (Stoka LMS todavia no tiene otro canal de
// contacto comercial — ver la nota extensa en lib/pricing.ts).
// ============================================================================

import Link from 'next/link';
import { headers } from 'next/headers';
import { ErrorBanner } from '@/components/ErrorBanner';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { StokaWordmark } from '@/components/StokaLogo';
import { getLocale } from '@/lib/locale';
import { getRegistroInstitucionDictionary } from '../dictionaries/registro-institucion';
import { crearSolicitud } from './actions';
import { RegistrationForm } from './RegistrationForm';

export default async function RegistroInstitucionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; enviado?: string; plan?: string }>;
}) {
  const [{ error, enviado, plan }, locale, hostHeader] = await Promise.all([
    searchParams,
    getLocale(),
    headers().then((h) => h.get('host') ?? ''),
  ]);
  const t = getRegistroInstitucionDictionary(locale);
  const isEnterprise = plan === 'enterprise';
  // El dominio real que va a recibir el subdominio elegido (ver
  // PLATFORM_ROOT_DOMAIN, tenant-registration.service.ts "buildDomain") —
  // antes decia ".stokalms.com" fijo en el texto, aunque este mismo
  // servidor estuviera corriendo bajo "localhost" (desarrollo) o cualquier
  // otro dominio real -- confuso, porque el dominio final de la institucion
  // terminaba siendo OTRO distinto al que el formulario le mostraba a quien
  // se estaba inscribiendo.
  const [rootHostname] = hostHeader.split(':');

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 flex justify-center">
        <StokaWordmark markClassName="h-10 w-10" />
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-muted hover:underline">
          &larr; {t.back}
        </Link>
        <LocaleSwitcher locale={locale} path="/registro-institucion" />
      </div>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mb-6 text-sm text-muted">{isEnterprise ? t.enterpriseIntro : t.subtitle}</p>

      {enviado && (
        <div className="mb-6 rounded-xl border border-success/20 bg-success-bg px-4 py-4 text-sm text-success">
          <p className="font-medium">{t.successTitle}</p>
          <p className="mt-1">{t.successBody}</p>
        </div>
      )}

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {!enviado && (
        <RegistrationForm
          action={crearSolicitud}
          t={t}
          rootHostname={rootHostname}
          messagePrefill={isEnterprise ? t.enterpriseMessagePrefill : undefined}
        />
      )}
    </div>
  );
}
