// ============================================================================
// admin-plataforma/layout.tsx — Encabezado de las pantallas de
// administracion de PLATAFORMA (hoy, solicitudes de alta + metricas). Vive
// fuera del route group "(app)" (ver la nota extensa en
// solicitudes/page.tsx) — no tiene el nav lateral de negocio de un tenant.
// Ninguna pantalla de aca se protege con el chequeo de sesion habitual de
// (app)/layout.tsx: cada pagina llama a "requireAccessToken" y el backend
// corta con 403 via PlatformAdminGuard si la cuenta no esta en
// PLATFORM_ADMIN_EMAILS — ver la nota en solicitudes/page.tsx. Por eso,
// para cuando este layout llega a pintarse de verdad, YA hay una sesion
// activa (si no la hubiera, "requireAccessToken" ya redirigio a "/" antes
// de que el contenido llegue al navegador) — alcanza con leer "auth()" aca
// para saber a quien mostrarle el boton de "Cerrar sesión".
//
// La administracion de DOMINIOS propios TAMBIEN vive en (app)/dominios/:
// es autoservicio de CADA institucion sobre su propio tenant, gateado por
// el permiso "tenant:edit" (Super Admin / Administrador de entidad) — ver
// la nota extensa en tenant-domain.service.ts. "Instituciones" (aca abajo)
// es la version de PLATAFORMA de eso mismo: activar/desactivar cualquier
// institucion, tocar sus dominios y sus roles SIN ser miembro de ella (ver
// platform-tenants.service.ts en el backend).
// ============================================================================

import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { cerrarSesionCompleta } from '../(app)/session-actions';
import { StokaMark } from '@/components/StokaLogo';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { NavLink } from '@/components/ui/NavLink';
import { InboxIcon, ChartIcon, BuildingIcon } from '@/components/ui/icons';
import { getLocale } from '@/lib/locale';

const TEXT = {
  es: {
    title: 'Stoka LMS · Administración de plataforma',
    requests: 'Solicitudes',
    institutions: 'Instituciones',
    metrics: 'Métricas',
    logout: 'Cerrar sesión',
  },
  en: {
    title: 'Stoka LMS · Platform administration',
    requests: 'Requests',
    institutions: 'Institutions',
    metrics: 'Metrics',
    logout: 'Log out',
  },
};

export default async function AdminPlataformaLayout({ children }: { children: React.ReactNode }) {
  // "/admin-plataforma" es exclusivo del dominio RAIZ de la plataforma
  // (ej. "lms.stoka.pe") — ninguna institucion (ni siquiera con su propio
  // dominio) deberia poder llegar aca desde SU subdominio. Antes de este
  // chequeo, la ruta era tecnicamente alcanzable desde cualquier Host (el
  // backend igual la protege con PlatformAdminGuard, asi que ningun dato
  // quedaba expuesto), pero confundia: quedaba un link "de plataforma"
  // colgando dentro del sitio de una institucion cualquiera. Se compara
  // sin puerto, mismo criterio que entrar/page.tsx.
  const hostHeader = (await headers()).get('host') ?? '';
  const [hostname] = hostHeader.split(':');
  // "?? 'localhost'": en desarrollo local esta variable no esta declarada
  // (ver apps/web/.env.example) — sin este respaldo, cualquier hostname
  // real nunca es igual a "undefined" y el redirect de arriba se
  // dispararia SIEMPRE, bloqueando /admin-plataforma tambien en local.
  const platformRootDomain = process.env.PLATFORM_ROOT_DOMAIN ?? 'localhost';
  if (hostname !== platformRootDomain) {
    redirect('/');
  }

  const rawSession = await auth();
  // "session.error" = refresh_token vencido/invalidado (ver la nota
  // extensa en app/page.tsx) — sin este filtro, esta barra mostraria el
  // menu y "Cerrar sesión" como si la sesion siguiera sirviendo, cuando en
  // realidad CUALQUIER pantalla de aca abajo va a rebotar a "/" apenas se
  // use (ver requireAccessToken, lib/api.ts).
  const session = rawSession?.error ? null : rawSession;
  const locale = await getLocale();
  const t = TEXT[locale];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <StokaMark className="h-6 w-6" />
            {t.title}
          </Link>
          <div className="flex items-center gap-4">
            {/* Sin sesion (ej. alguien llego a "/admin-plataforma" a
               iniciar sesion, ver page.tsx) no tiene sentido mostrar
               navegacion hacia pantallas que igual van a redirigirla de
               vuelta por "requireAccessToken" — confuso mostrar un menu
               de un panel al que todavia no entraste. */}
            {session && (
              <nav className="flex gap-1">
                <NavLink href="/admin-plataforma/solicitudes" icon={<InboxIcon className="h-4 w-4" />}>
                  {t.requests}
                </NavLink>
                <NavLink href="/admin-plataforma/instituciones" icon={<BuildingIcon className="h-4 w-4" />}>
                  {t.institutions}
                </NavLink>
                <NavLink href="/admin-plataforma/metricas" icon={<ChartIcon className="h-4 w-4" />}>
                  {t.metrics}
                </NavLink>
              </nav>
            )}
            <LocaleSwitcher locale={locale} path="/admin-plataforma" />
            {session && (
              <form action={cerrarSesionCompleta} className="border-l border-border pl-4">
                <button
                  type="submit"
                  className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
                >
                  {t.logout}
                </button>
              </form>
            )}
          </div>
        </div>
      </header>
      <main className="py-6">{children}</main>
    </div>
  );
}
