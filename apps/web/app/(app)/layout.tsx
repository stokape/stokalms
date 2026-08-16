// ============================================================================
// (app)/layout.tsx — Cascaron comun de TODAS las pantallas de negocio
// (Cursos, Mis matriculas, Certificados, Plantillas...).
//
// El nombre de carpeta entre parentesis, "(app)", es un "route group" de
// Next.js: agrupa rutas para compartir este layout SIN agregar "/app/" a la
// URL (por eso "/cursos" y no "/app/cursos"). Es exactamente lo mismo que
// hace "dashboard/page.tsx" (fuera de este grupo, sigue existiendo tal cual
// para diagnostico), pero puesto una sola vez en vez de repetido en cada
// pantalla nueva.
//
// Relacion con el resto del proyecto:
// - Repite la misma comprobacion de sesion que dashboard/page.tsx (ver
//   ../dashboard/page.tsx) porque un layout de Next.js NO protege
//   automaticamente a sus paginas hijas de nada — si esta funcion no
//   redirige, cualquier pagina de adentro se ejecutaria igual.
// - Llama a GET /auth/me una sola vez (para mostrar el nombre de quien
//   inicio sesion en la barra superior); cada pagina hija hace sus PROPIAS
//   llamadas a la API para sus propios datos.
//
// DISEÑO: barra lateral en vez del nav horizontal de antes — con 8-9
// enlaces posibles segun el rol, una fila horizontal se volvia ilegible
// (todo apretado, sin jerarquia). El toggle para mobile ("Menú" arriba) es
// CSS puro (un <input type="checkbox"> oculto + "peer-checked", ver mas
// abajo) a proposito, no un Client Component: sigue funcionando incluso
// si algo tarda en hidratar React, mismo criterio de progressive
// enhancement que ya usan los formularios de toda la app.
// ============================================================================

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { apiFetch, apiFetchPublic, can, type Permissions } from '@/lib/api';
import { IdleSessionGuard } from '@/components/IdleSessionGuard';
import { NotificationBell } from '@/components/NotificationBell';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { StokaWordmark, StokaMark } from '@/components/StokaLogo';
import { StokaBrandingBadge } from '@/components/StokaBrandingBadge';
import { NavLink } from '@/components/ui/NavLink';
import { getLocale } from '@/lib/locale';
import { getAppDictionary } from '../dictionaries/app';
import {
  CoursesIcon,
  CalendarIcon,
  ChartIcon,
  BookmarkIcon,
  AwardIcon,
  FileIcon,
  GearIcon,
  GlobeIcon,
  UsersIcon,
  UserCircleIcon,
  LogoutIcon,
  MenuIcon,
  WrenchIcon,
  DashboardIcon,
  ReportIcon,
  CohortIcon,
  AutomationIcon,
  ShieldIcon,
} from '@/components/ui/icons';
import { cerrarSesionCompleta, reingresarConContrasena } from './session-actions';

interface StokaUser {
  fullName: string;
  email: string;
  permissions: string[];
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.accessToken) {
    redirect('/');
  }

  const locale = await getLocale();
  const t = getAppDictionary(locale);

  // Si /auth/me falla (ej. el backend esta caido), no tiene sentido
  // bloquear TODA la navegacion por eso — se muestra la barra igual, sin
  // nombre y sin ningun enlace que dependa de permisos, y cada pagina hija
  // va a mostrar su propio error al intentar cargar sus datos.
  let me: StokaUser | null = null;
  try {
    me = await apiFetch<StokaUser>(session.accessToken, '/auth/me');
  } catch {
    me = null;
  }
  const permissions: Permissions = new Set(me?.permissions ?? []);
  const isStaff = can(permissions, 'enrollment', 'view') || can(permissions, 'enrollment', 'create');

  // Mismo criterio "best effort" que "me"/"tenantInfo" arriba: si esto
  // falla, la campana simplemente se ve sin pastilla — nunca motivo para
  // bloquear el resto de la navegación.
  let unreadNotifications = 0;
  try {
    const { count } = await apiFetch<{ count: number }>(session.accessToken, '/notifications/unread-count');
    unreadNotifications = count;
  } catch {
    unreadNotifications = 0;
  }

  // Modo mantenimiento (ver /mantenimiento y app/page.tsx): igual que en el
  // home publico, solo "tenant:edit" (Super Admin / Administrador de
  // entidad) puede seguir usando el resto de la app mientras esta prendido
  // — a cualquier otra persona ya logueada se la manda al home, que le va a
  // mostrar la pantalla de aviso en vez de dejarla seguir navegando.
  //
  // Institucion DESACTIVADA por plataforma (ver Tenant.active): a
  // diferencia del mantenimiento, esto manda a TODO el mundo al home sin
  // excepcion — ni siquiera "tenant:edit" sirve aca, porque solo un
  // Administrador de plataforma puede reactivarla (ver
  // /admin-plataforma/instituciones). En la practica, si esta desactivada
  // el fetch de abajo es la UNICA llamada al backend que no corta con 403
  // (ver tenant-context.middleware.ts) — cualquier otra pantalla de esta
  // app ya habria fallado antes de llegar aca.
  let tenantInfo: {
    name?: string;
    active?: boolean;
    maintenanceMode?: boolean;
    branding?: { hideStokaBranding?: boolean; logoUrl?: string };
  } | null = null;
  try {
    tenantInfo = await apiFetchPublic('/tenant/public');
  } catch {
    tenantInfo = null;
  }
  if (tenantInfo?.active === false) {
    redirect('/');
  }
  const maintenanceOn = Boolean(tenantInfo?.maintenanceMode);
  const canBypassMaintenance = can(permissions, 'tenant', 'edit');
  if (maintenanceOn && !canBypassMaintenance) {
    redirect('/');
  }

  return (
    <div className="min-h-screen">
      <input type="checkbox" id="nav-toggle" className="peer hidden" />

      {/* Fondo oscuro detras del menu en mobile, mientras esta abierto —
          hacer clic ahi (la propia label) tambien lo cierra. */}
      <label
        htmlFor="nav-toggle"
        className="fixed inset-0 z-30 hidden bg-black/40 peer-checked:block lg:!hidden"
      />

      <aside
        className="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r
                   border-border bg-surface transition-transform duration-200
                   peer-checked:translate-x-0 lg:translate-x-0"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
          <Link href="/cursos" className="flex min-w-0 items-center gap-2">
            {tenantInfo?.branding?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- logo de
              // la institucion, viene de una URL firmada de storage.service.ts,
              // no de un asset local que "next/image" pueda optimizar.
              <img
                src={tenantInfo.branding.logoUrl}
                alt={tenantInfo.name ?? 'Logo'}
                className="h-8 max-w-[9rem] object-contain"
              />
            ) : (
              <StokaWordmark markClassName="h-8 w-8" />
            )}
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell count={unreadNotifications} label={t.nav.notifications} />
            <LocaleSwitcher locale={locale} path="/cursos" />
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <NavLink href="/cursos" icon={<CoursesIcon className="h-5 w-5" />}>
            {t.nav.courses}
          </NavLink>
          {can(permissions, 'dashboard', 'view') && (
            <NavLink href="/panel" icon={<DashboardIcon className="h-5 w-5" />}>
              {t.nav.panel}
            </NavLink>
          )}
          {can(permissions, 'term', 'view') && (
            <NavLink href="/periodos" icon={<CalendarIcon className="h-5 w-5" />}>
              {t.nav.terms}
            </NavLink>
          )}
          <NavLink href="/notas" icon={<ChartIcon className="h-5 w-5" />}>
            {t.nav.grades}
          </NavLink>
          {can(permissions, 'report', 'view') && (
            <NavLink href="/reportes" icon={<ReportIcon className="h-5 w-5" />}>
              {t.nav.reports}
            </NavLink>
          )}
          {can(permissions, 'cohort', 'view') && (
            <NavLink href="/cohortes" icon={<CohortIcon className="h-5 w-5" />}>
              {t.nav.cohorts}
            </NavLink>
          )}
          {/* "Mis matrículas"/"Mis certificados" son autoservicio para
              alguien que ESTUDIA — se ocultan para roles de personal que
              ya tienen "enrollment:view" o "enrollment:create" (ven la
              misma información, de TODOS los alumnos, desde Cursos →
              Sección): mostrárselos igual los confundía (¿"mis"
              certificados de qué, si no estudian?), ver la nota extensa
              en ../mis-certificados/page.tsx. */}
          {!isStaff && (
            <>
              <NavLink href="/mis-matriculas" icon={<BookmarkIcon className="h-5 w-5" />}>
                {t.nav.myEnrollments}
              </NavLink>
              <NavLink href="/mis-certificados" icon={<AwardIcon className="h-5 w-5" />}>
                {t.nav.myCertificates}
              </NavLink>
            </>
          )}
          {can(permissions, 'certificate_template', 'view') && (
            <NavLink href="/plantillas-certificado" icon={<FileIcon className="h-5 w-5" />}>
              {t.nav.certificateTemplates}
            </NavLink>
          )}
          {can(permissions, 'tenant', 'edit') && (
            <NavLink href="/configuracion-marca" icon={<GearIcon className="h-5 w-5" />}>
              {t.nav.branding}
            </NavLink>
          )}
          {can(permissions, 'tenant', 'edit') && (
            <NavLink href="/dominios" icon={<GlobeIcon className="h-5 w-5" />}>
              {t.nav.domains}
            </NavLink>
          )}
          {can(permissions, 'tenant', 'edit') && (
            <NavLink href="/mantenimiento" icon={<WrenchIcon className="h-5 w-5" />}>
              {t.nav.maintenance}
            </NavLink>
          )}
          {can(permissions, 'tenant', 'edit') && (
            <NavLink href="/automatizaciones" icon={<AutomationIcon className="h-5 w-5" />}>
              {t.nav.automations}
            </NavLink>
          )}
          {(can(permissions, 'tenant', 'edit') || can(permissions, 'audit', 'view')) && (
            <NavLink href="/seguridad" icon={<ShieldIcon className="h-5 w-5" />}>
              {t.nav.security}
            </NavLink>
          )}
          {can(permissions, 'role', 'view') && (
            <NavLink href="/usuarios" icon={<UsersIcon className="h-5 w-5" />}>
              {t.nav.users}
            </NavLink>
          )}
          <NavLink href="/perfil" icon={<UserCircleIcon className="h-5 w-5" />}>
            {t.nav.profile}
          </NavLink>
        </nav>

        <div className="border-t border-border p-3">
          {me && (
            <div className="mb-2 flex items-center gap-2 rounded-lg px-2 py-1.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {me.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{me.fullName}</p>
                <p className="truncate text-xs text-muted">{me.email}</p>
              </div>
            </div>
          )}
          <form action={cerrarSesionCompleta}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-danger-bg hover:text-danger"
            >
              <LogoutIcon className="h-5 w-5" />
              {t.nav.logout}
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
          <label
            htmlFor="nav-toggle"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border"
            aria-label={t.nav.openMenu}
          >
            <MenuIcon className="h-5 w-5" />
          </label>
          {tenantInfo?.branding?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenantInfo.branding.logoUrl}
              alt={tenantInfo.name ?? 'Logo'}
              className="h-6 max-w-[8rem] object-contain"
            />
          ) : (
            <>
              <StokaMark className="h-6 w-6" />
              <span className="text-sm font-semibold">Stoka LMS</span>
            </>
          )}
          <span className="ml-auto flex items-center gap-2">
            <NotificationBell count={unreadNotifications} label={t.nav.notifications} />
            <LocaleSwitcher locale={locale} path="/cursos" />
          </span>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Si llegamos hasta aca con maintenanceOn en true, es porque el
             redirect de arriba YA descarto a cualquiera sin "tenant:edit"
             — este aviso es solo un recordatorio para quien lo dejo
             prendido. */}
          {maintenanceOn && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-warning-bg px-4 py-3 text-sm text-warning">
              <span>⚠️ {t.maintenanceBanner.message}</span>
              <Link href="/mantenimiento" className="font-medium underline">
                {t.maintenanceBanner.disable}
              </Link>
            </div>
          )}
          {children}

          {!tenantInfo?.branding?.hideStokaBranding && (
            <StokaBrandingBadge label={t.footer.poweredBy} className="mt-10 border-t border-border pt-6" />
          )}
        </main>
      </div>

      <IdleSessionGuard
        userLabel={me?.fullName ?? me?.email ?? t.nav.defaultUserLabel}
        onReingresar={reingresarConContrasena.bind(null, me?.email)}
        onCerrarSesion={cerrarSesionCompleta}
        locale={locale}
      />
    </div>
  );
}
