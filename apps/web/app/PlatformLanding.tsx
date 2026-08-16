// ============================================================================
// PlatformLanding.tsx — Home de LA PLATAFORMA (no de una institución en
// particular): lo que ve alguien que entra por el dominio raíz
// (PLATFORM_ROOT_DOMAIN, ver tenant.service.ts "getPublicInfo" — sin
// tenant resuelto). Antes esto era la MISMA tarjeta angosta de login que
// usa cada institución (ver InstitutionHome.tsx) con apenas un párrafo
// distinto — funcional, pero no explicaba qué es Stoka LMS ni por qué una
// institución nueva debería inscribirse. Esto SÍ es una landing real.
//
// Server Component: no necesita nada de JS en el cliente (ni un carrusel,
// ni un acordeón) — todo el contenido es estático o depende de la sesión
// o el idioma, que ya se resuelven en el servidor (ver page.tsx y
// lib/locale.ts).
//
// Español/inglés SOLO en esta página + /entrar + /registro-institucion
// (ver dictionaries/landing.ts) — el resto de la aplicación (cursos,
// notas, etc.) sigue en español únicamente; traducirla entera es un
// cambio de arquitectura mucho más grande (rutas por idioma, extraer
// cada texto de ~60 pantallas) que se dejó fuera a propósito de esta
// tanda de cambios.
// ============================================================================

import Link from 'next/link';
import type { Session } from 'next-auth';
import { cerrarSesionCompleta } from './(app)/session-actions';
import { LinkButton } from '@/components/ui/LinkButton';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { StokaMark, StokaWordmark } from '@/components/StokaLogo';
import { InstitutionMosaic } from './InstitutionMosaic';
import type { Locale } from '@/lib/locale';
import { FEATURE_KEYS, getLandingDictionary, type FeatureKey } from './dictionaries/landing';
import { getPreciosDictionary } from './dictionaries/precios';
import { getPricingPlans } from '@/lib/pricing';
import { PricingSection } from './precios/PricingSection';
import {
  CoursesIcon,
  BookmarkIcon,
  ChartIcon,
  AwardIcon,
  UsersIcon,
  GlobeIcon,
  CalendarIcon,
  GearIcon,
} from '@/components/ui/icons';

// El icono de cada feature es puramente visual (no cambia entre idiomas),
// por eso vive aparte del diccionario — solo el texto se traduce.
const FEATURE_ICONS: Record<FeatureKey, (p: { className?: string }) => React.ReactElement> = {
  courses: CoursesIcon,
  enrollments: BookmarkIcon,
  grades: ChartIcon,
  certificates: AwardIcon,
  roles: UsersIcon,
  branding: GlobeIcon,
  attendance: CalendarIcon,
  isolation: GearIcon,
};

export async function PlatformLanding({ session, locale }: { session: Session | null; locale: Locale }) {
  const t = getLandingDictionary(locale);
  // Planes y precios vive ACA (una sola pagina, la home) en vez de en su
  // propia ruta — ver /precios/page.tsx, que ahora solo redirige a
  // "#precios" para no romper ningun enlace ya compartido. Mismo
  // componente (PricingSection) que antes armaba esa pagina aparte, sin
  // duplicar nada.
  const preciosT = getPreciosDictionary(locale);
  const plans = await getPricingPlans();

  return (
    <div className="flex-1">
      <Nav session={session} locale={locale} t={t} />
      <Hero session={session} t={t} />
      <Features t={t} />
      <Audiences t={t} />
      <div id="precios" className="scroll-mt-16">
        <PricingSection plans={plans} t={preciosT} />
      </div>
      <CtaBand session={session} t={t} />
      <Footer t={t} locale={locale} />
    </div>
  );
}

type Dict = ReturnType<typeof getLandingDictionary>;

function Nav({ session, locale, t }: { session: Session | null; locale: Locale; t: Dict }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/">
          <StokaWordmark markClassName="h-8 w-8" />
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/#precios" className="text-sm font-medium text-foreground hover:text-primary">
            {t.nav.pricing}
          </Link>
          {session ? (
            <>
              {/* Este landing SOLO se renderiza cuando el Host del request
                 no resuelve a NINGUNA institucion (ver page.tsx) — una
                 sesion activa aca, entonces, nunca es la de un miembro de
                 un tenant (esa persona veria InstitutionHome en SU propio
                 subdominio), es la de alguien del equipo de plataforma. */}
              <LinkButton href="/admin-plataforma/solicitudes" variant="primary" size="sm">
                {t.nav.enterPlatform}
              </LinkButton>
              <form action={cerrarSesionCompleta}>
                <button
                  type="submit"
                  className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
                >
                  {t.nav.logout}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/entrar" className="text-sm font-medium text-foreground hover:text-primary">
                {t.nav.login}
              </Link>
              <LinkButton href="/registro-institucion" variant="primary" size="sm">
                {t.nav.registerCta}
              </LinkButton>
            </>
          )}
          <LocaleSwitcher locale={locale} path="/" />
        </div>
      </div>
    </header>
  );
}

function Hero({ session, t }: { session: Session | null; t: Dict }) {
  return (
    <section className="border-b border-border">
      {/* Dos columnas desde "lg": el texto a la izquierda, el mosaico de
         instituciones a la derecha — a proposito NO centrado (el layout
         "todo centrado" es el default de cualquier landing de SaaS, ver
         InstitutionMosaic.tsx). En mobile se apilan: texto primero, mosaico
         despues. */}
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
        <div>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {t.hero.badge}
          </span>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            {t.hero.titlePrefix} <span className="text-primary">{t.hero.titleHighlight}</span>
          </h1>

          <p className="mt-6 max-w-xl text-base text-muted sm:text-lg">{t.hero.subtitle}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {session ? (
              <LinkButton href="/admin-plataforma/solicitudes" variant="primary" size="lg">
                {t.hero.ctaEnter}
              </LinkButton>
            ) : (
              <>
                <LinkButton href="/registro-institucion" variant="primary" size="lg">
                  {t.hero.ctaRegister}
                </LinkButton>
                <LinkButton href="/entrar" variant="secondary" size="lg">
                  {t.hero.ctaLogin}
                </LinkButton>
              </>
            )}
          </div>

          <p className="mt-4 text-xs text-muted">{t.hero.approvalNote}</p>
        </div>

        <div>
          <InstitutionMosaic />
          <p className="mt-4 text-center text-xs text-muted">{t.hero.mosaicCaption}</p>
        </div>
      </div>
    </section>
  );
}

function Features({ t }: { t: Dict }) {
  return (
    <section className="border-t border-border bg-surface/50">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t.features.heading}</h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_KEYS.map((key) => {
            const Icon = FEATURE_ICONS[key];
            const { title, description } = t.features.items[key];
            return (
              <div key={key} className="rounded-xl border border-border bg-surface p-5 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 text-sm font-semibold">{title}</h3>
                <p className="text-sm text-muted">{description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Audiences({ t }: { t: Dict }) {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-4xl px-6 py-14 text-center">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          {t.audiences.heading}
        </h2>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {t.audiences.items.map((audience) => (
            <span
              key={audience}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium"
            >
              {audience}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand({ session, t }: { session: Session | null; t: Dict }) {
  if (session) return null;

  return (
    <section className="border-t border-border bg-primary/5">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 py-14 text-center">
        <h2 className="font-display text-2xl font-semibold tracking-tight">{t.ctaBand.heading}</h2>
        <p className="max-w-xl text-sm text-muted">{t.ctaBand.body}</p>
        <LinkButton href="/registro-institucion" variant="primary" size="lg">
          {t.ctaBand.cta}
        </LinkButton>
      </div>
    </section>
  );
}

// Nota: a proposito NO hay ningun link/boton de "acceso de administracion"
// aca — ver admin-plataforma/page.tsx, el punto de entrada para el equipo
// de Stoka (sin sesion) o para volver al panel (con sesion). Vive SIN
// ningun link publico que apunte ahi: alguien de afuera visitando la
// landing no tiene forma de darse cuenta de que existe, solo quien ya
// conoce la URL (marcada como favorito, ver la conversacion con Javier).
// La proteccion REAL sigue siendo PlatformAdminGuard/PLATFORM_ADMIN_EMAILS
// del lado del backend — esto es higiene de descubrimiento, no seguridad.
function Footer({ t, locale }: { t: Dict; locale: Locale }) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-muted sm:flex-row">
        <div className="flex items-center gap-2">
          <StokaMark className="h-5 w-5" />
          <span>{t.footer.tagline}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/#precios" className="hover:text-foreground hover:underline">
            {t.nav.pricing}
          </Link>
          <Link href="/entrar" className="hover:text-foreground hover:underline">
            {t.footer.login}
          </Link>
          <LocaleSwitcher locale={locale} path="/" />
        </div>
      </div>
    </footer>
  );
}
