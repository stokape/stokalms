// ============================================================================
// entrar/page.tsx — Paso PREVIO al login cuando se entra por el dominio
// raíz de la plataforma (ver PlatformLanding.tsx): como Stoka LMS es
// multi-tenant y el tenant se resuelve por dominio (ver
// tenant-context.middleware.ts, backend), el botón "Iniciar sesión" del
// dominio raíz NO puede mandar directo a Keycloak — todavía no sabemos a
// qué institución pertenece la persona. Aquí se le pide el nombre/
// subdominio de su institución y, si existe, se muestra un enlace para
// continuar hacia SU propio subdominio, donde el botón "Iniciar sesión"
// de esa institución (ver InstitutionHome.tsx) sí hace login directo.
//
// IMPORTANTE — por qué esto es un <a> y NO un redirect() automático
// dentro del <form>: el CSP de esta app (ver middleware.ts) incluye
// "form-action 'self'", que bloquea a un <form> terminar en una
// redirección hacia OTRO origen (un subdominio distinto ya cuenta como
// otro origen) — se detectó probando de verdad: el navegador tira
// "violates ... form-action 'self'" y aborta la navegación en seco. Un
// <a> común no cae bajo esa restricción (CSP no controla a dónde puede
// apuntar un link), así que el paso de "encontramos tu institución" se
// resuelve con un enlace para continuar, no con un salto automático.
//
// Reusa el mismo endpoint público que usa Caddy en producción para decidir
// a qué dominios emitirles certificado TLS (ver domain-check.controller.ts)
// — ya sabe distinguir un subdominio real de uno inventado, no hacía falta
// otra ruta para esto.
// ============================================================================

import Link from 'next/link';
import { headers } from 'next/headers';
import { apiFetchPublic } from '@/lib/api';
import { getLocale } from '@/lib/locale';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/Button';
import { LinkButton } from '@/components/ui/LinkButton';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { StokaWordmark } from '@/components/StokaLogo';
import { getEntrarDictionary } from '../dictionaries/entrar';

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ institucion?: string }>;
}) {
  const [{ institucion }, locale] = await Promise.all([searchParams, getLocale()]);
  const t = getEntrarDictionary(locale);

  const hostHeader = (await headers()).get('host') ?? '';
  const [rootHostname, port] = hostHeader.split(':');

  const slug = institucion?.trim().toLowerCase() ?? '';
  let foundUrl: string | null = null;
  let foundDomain = '';
  let notFound = false;

  if (slug) {
    const candidateDomain = `${slug}.${rootHostname}`;
    try {
      // "&strict=true": esto pregunta "¿esta institucion existe de
      // verdad?", no "¿le emito un certificado?" — ver la nota grande en
      // domain-check.controller.ts.
      await apiFetchPublic(`/domain-check?domain=${encodeURIComponent(candidateDomain)}&strict=true`);
      // No podemos saber si el servidor real corre bajo https (producción)
      // o http (desarrollo local) más que por esto — no hay ningún proxy
      // delante en desarrollo que agregue "x-forwarded-proto".
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      foundDomain = candidateDomain;
      foundUrl = `${protocol}://${candidateDomain}${port ? `:${port}` : ''}/`;
    } catch {
      notFound = true;
    }
    // Sin el texto que escribio (ver create-analytics-event.dto.ts) —
    // "found" alcanza para ver donde se cae el embudo, sin guardar de mas.
    void trackEvent('entrar_search', { host: hostHeader, metadata: { found: !notFound } });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 flex justify-center">
        <StokaWordmark markClassName="h-10 w-10" />
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-muted hover:underline">
          &larr; {t.back}
        </Link>
        <LocaleSwitcher locale={locale} path="/entrar" />
      </div>

      {foundUrl ? (
        <>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight">{t.foundTitle}</h1>
          <p className="mb-6 text-sm text-muted">{t.foundBody(foundDomain)}</p>
          {/* <a> comun a proposito, no next/link — ver la nota grande de
             arriba sobre CSP "form-action" (que no aplica aca, esto ni
             siquiera es un form) y sobre que este SI es un cambio real de
             dominio, algo para lo que next/link tampoco esta pensado. */}
          <LinkButton href={foundUrl} className="w-full">
            {t.continueLink}
          </LinkButton>
          <Link href="/entrar" className="mt-4 text-center text-sm text-muted hover:underline">
            {t.searchAgain}
          </Link>
        </>
      ) : (
        <>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="mb-6 text-sm text-muted">{t.subtitle}</p>

          <form method="GET" className="flex flex-col gap-1.5">
            <label className="flex flex-col gap-1.5 text-sm">
              {t.fieldLabel}
              {/* El error (si lo hay) se ata a ESTE campo — borde en rojo +
                 mensaje pegado justo debajo, en vez de un bloque aparte
                 flotando entre el subtitulo y el formulario. Así se lee
                 como "esto es lo que escribiste, y no lo encontramos" en
                 vez de un error genérico de sistema. */}
              <div
                className={`flex items-stretch overflow-hidden rounded-lg border transition-colors focus-within:ring-2 ${
                  notFound
                    ? 'border-danger focus-within:ring-danger/30'
                    : 'border-border focus-within:ring-primary/30'
                }`}
              >
                <input
                  name="institucion"
                  type="text"
                  required
                  autoFocus
                  defaultValue={slug}
                  placeholder={t.placeholder}
                  aria-invalid={notFound || undefined}
                  aria-describedby={notFound ? 'institucion-error' : undefined}
                  className="w-full bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted"
                />
                <span className="flex shrink-0 items-center whitespace-nowrap bg-black/[.03] px-3 text-sm text-muted dark:bg-white/[.06]">
                  .{rootHostname}
                </span>
              </div>
            </label>

            {notFound && (
              <p
                id="institucion-error"
                className="flex items-start gap-1.5 pb-1.5 text-xs text-danger [animation:fade-in-up_0.2s_ease-out]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
                </svg>
                <span>{t.notFound(slug)}</span>
              </p>
            )}

            <Button type="submit" className="mt-1.5">
              {t.continue}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {t.noAccount}{' '}
            <Link href="/registro-institucion" className="text-primary hover:underline">
              {t.registerLink}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
