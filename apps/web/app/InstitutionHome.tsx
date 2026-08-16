// ============================================================================
// InstitutionHome.tsx — Home cuando el dominio SI resuelve a una
// institucion (ver GET /tenant/public) — su logo, su marca, el boton de
// iniciar sesion. Extraido de page.tsx para separarlo del home genérico de
// la plataforma (ver PlatformLanding.tsx, que es un diseño de landing
// completo — mezclar los dos en un mismo archivo los hacia dificiles de
// leer por separado).
// ============================================================================

import Link from 'next/link';
import type { Session } from 'next-auth';
import { signIn } from '@/auth';
import { cerrarSesionCompleta } from './(app)/session-actions';
import { trackEvent } from '@/lib/analytics';
import { StokaMark } from '@/components/StokaLogo';
import { StokaBrandingBadge } from '@/components/StokaBrandingBadge';
import { WrenchIcon } from '@/components/ui/icons';

interface TenantBranding {
  logoUrl?: string;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  hideStokaBranding?: boolean;
}

export interface PublicTenantInfo {
  name: string;
  branding: TenantBranding;
  // Desactivada por un Administrador de PLATAFORMA (ver Tenant.active,
  // schema.prisma, y platform-tenants.service.ts) — a diferencia del modo
  // mantenimiento de abajo, esto NO tiene excepcion para nadie, ni siquiera
  // para quien tiene "tenant:edit" en esta institucion: solo un
  // Administrador de plataforma la puede reactivar (desde
  // /admin-plataforma/instituciones). "?" porque una respuesta vieja en
  // cache del navegador (poco probable, esto nunca se cachea) no deberia
  // reventar si faltara.
  active?: boolean;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  maintenanceEndsAt?: string;
  maintenanceImageUrl?: string;
}

const DEFAULT_MAINTENANCE_MESSAGE =
  'Estamos haciendo tareas de mantenimiento. Volvemos en un rato.';

export function InstitutionHome({
  tenant,
  session,
  canBypassMaintenance,
}: {
  tenant: PublicTenantInfo;
  session: Session | null;
  canBypassMaintenance: boolean;
}) {
  // "=== false" a proposito (no "!tenant.active"): tenants existentes desde
  // antes de esta columna migraron con el default "true" (ver la migracion
  // add_tenant_active), asi que un "undefined" nunca deberia pasar en la
  // practica — pero si pasara, se prefiere tratarlo como activa (fail-open
  // en la UI) antes que bloquear por accidente a una institucion que nunca
  // fue desactivada.
  const isDeactivated = tenant.active === false;
  const maintenanceOn = Boolean(tenant.maintenanceMode);
  const blockedByMaintenance = maintenanceOn && !(session && canBypassMaintenance);

  const branding = tenant.branding ?? {};
  // Mientras se ve la pantalla de mantenimiento, el fondo es LIBRE: la
  // imagen que se haya subido en /mantenimiento (ver mantenimiento/page.tsx)
  // reemplaza al fondo de todos los dias, para que el aviso pueda tener su
  // propio look puntual sin tocar la marca habitual de la institucion. Si
  // no se subio ninguna, se sigue viendo el fondo normal de la institucion.
  const effectiveBackgroundImageUrl =
    (blockedByMaintenance && tenant.maintenanceImageUrl) || branding.backgroundImageUrl;
  const hasCustomBackground = Boolean(effectiveBackgroundImageUrl || branding.backgroundColor);

  return (
    <div
      className={
        'relative flex flex-1 items-center justify-center overflow-hidden px-6 py-12 ' +
        (hasCustomBackground ? '' : 'bg-gradient-to-br from-primary/10 via-background to-background')
      }
    >
      {/* La imagen de fondo va en una capa APARTE, agrandada y difuminada
          (en vez de aplicar el "blur" al contenedor entero), para que el
          desenfoque no le pegue tambien a la tarjeta de login de encima —
          mismo criterio que la vista previa en vivo de
          configuracion-marca/BrandingStudio.tsx, para que se vea IGUAL ahi
          que aca. */}
      {effectiveBackgroundImageUrl && (
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center blur-xl"
          style={{ backgroundImage: `url(${effectiveBackgroundImageUrl})` }}
        />
      )}
      {!effectiveBackgroundImageUrl && branding.backgroundColor && (
        <div className="absolute inset-0" style={{ backgroundColor: branding.backgroundColor }} />
      )}
      {effectiveBackgroundImageUrl && <div className="absolute inset-0 bg-black/45" />}

      <div
        className={
          'relative w-full max-w-sm rounded-2xl border p-8 text-center shadow-lg ' +
          (effectiveBackgroundImageUrl
            ? 'border-white/10 bg-white/95 backdrop-blur dark:bg-zinc-900/95'
            : 'border-border bg-surface')
        }
      >
        {branding.logoUrl ? (
          // Logo con URL propia de cada institucion: no se puede usar
          // next/image sin declarar de antemano cada dominio remoto posible
          // (una institucion nueva podria alojar su logo en CUALQUIER
          // servidor) — una <img> comun es la opcion correcta aca.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={branding.logoUrl}
            alt={`Logo de ${tenant.name}`}
            className="mx-auto mb-4 h-16 w-auto object-contain"
          />
        ) : (
          <StokaMark className="mx-auto mb-4 h-14 w-14" title="Stoka LMS" />
        )}

        {/* Quien SI puede desactivarlo (tenant:edit) sigue viendo todo con
           normalidad debajo — este aviso es solo para que no se olvide de
           que lo dejo prendido para el resto. */}
        {maintenanceOn && !blockedByMaintenance && !isDeactivated && (
          <div className="mb-4 rounded-lg bg-warning-bg px-3 py-2 text-left text-xs text-warning">
            <p className="font-medium">⚠️ Modo mantenimiento activo</p>
            <p className="mt-0.5">
              El resto de las personas no puede entrar.{' '}
              <Link href="/mantenimiento" className="underline">
                Desactivarlo
              </Link>
            </p>
          </div>
        )}

        <h1 className="text-2xl font-semibold tracking-tight">{tenant.name}</h1>

        {isDeactivated ? (
          // Nadie entra mientras esta desactivada — ni siquiera se ofrece
          // "Iniciar sesión": aunque Keycloak lo dejara pasar, la PRIMERA
          // llamada real a la API cortaria con 403 (ver
          // tenant-context.middleware.ts), asi que mostrarlo aca solo
          // confundiria. Si hay sesion vieja, se ofrece cerrarla nomas.
          <div className="mt-2">
            <div className="mx-auto mb-4 mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg text-danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
                <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 9l6 6M15 9l-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="mb-6 text-sm text-muted">
              Esta institución fue desactivada por el equipo de Stoka LMS. Si crees que es un
              error, contacta al equipo de plataforma.
            </p>
            {session && (
              <form action={cerrarSesionCompleta}>
                <button type="submit" className="text-sm text-muted underline hover:text-foreground">
                  Cerrar sesión
                </button>
              </form>
            )}
          </div>
        ) : blockedByMaintenance ? (
          // Pantalla de mantenimiento: reemplaza el login/acceso normal
          // para cualquiera SIN el permiso "tenant:edit" — pero el boton de
          // "Iniciar sesión" se mantiene (si no hay sesion todavia) para
          // que justamente Super Admin/Administrador de entidad puedan
          // entrar y apagarlo desde /mantenimiento.
          <div className="mt-2">
            <div className="mx-auto mb-4 mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-warning-bg text-warning">
              <WrenchIcon className="h-6 w-6" />
            </div>
            <p className="mb-2 text-sm text-muted">
              {tenant.maintenanceMessage || DEFAULT_MAINTENANCE_MESSAGE}
            </p>
            {tenant.maintenanceEndsAt && (
              <p className="mb-6 text-xs text-muted">
                Volvemos aprox. a las{' '}
                {new Date(tenant.maintenanceEndsAt).toLocaleString('es-PE', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
                .
              </p>
            )}
            {!tenant.maintenanceEndsAt && <div className="mb-6" />}

            {session ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-muted">
                  Tu cuenta no tiene permiso para usar la plataforma mientras dure el
                  mantenimiento.
                </p>
                <form action={cerrarSesionCompleta}>
                  <button
                    type="submit"
                    className="text-sm text-muted underline hover:text-foreground"
                  >
                    Cerrar sesión
                  </button>
                </form>
              </div>
            ) : (
              <form
                action={async () => {
                  'use server';
                  void trackEvent('login_started', { metadata: { flow: 'institution' } });
                  await signIn('keycloak');
                }}
                className="w-full"
              >
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  Iniciar sesión
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            <p className="mt-2 mb-8 text-sm text-muted">Plataforma de gestión de aprendizaje.</p>

            {session ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-muted">
                  Sesión iniciada como{' '}
                  <strong className="text-foreground">
                    {session.user?.email ?? session.user?.name}
                  </strong>
                </p>
                {/* "/dashboard" sigue existiendo (para quien necesite confirmar
                   que el token es aceptado por el backend), pero deliberadamente
                   SIN enlace desde el menu de negocio ni desde aca: mezclada con
                   la navegacion normal, esa pantalla de JSON crudo confundia a
                   quien no sabe que es una pantalla tecnica (se detecto probando
                   con un usuario real). Se llega a ella escribiendo la URL a mano. */}
                <Link
                  href="/cursos"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  Entrar a la plataforma
                </Link>
                <form action={cerrarSesionCompleta}>
                  <button
                    type="submit"
                    className="text-sm text-muted underline hover:text-foreground"
                  >
                    Cerrar sesión
                  </button>
                </form>
              </div>
            ) : (
              <form
                action={async () => {
                  'use server';
                  void trackEvent('login_started', { metadata: { flow: 'institution' } });
                  await signIn('keycloak');
                }}
                className="w-full"
              >
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  Iniciar sesión
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {/* "absolute" a proposito, no un hermano mas del flex de arriba (que
         es "flex-row", no "flex-col": un hermano comun quedaria al LADO de
         la tarjeta, no debajo) — clavado abajo de la pantalla, fuera de la
         capa de fondo/blur, para que se vea igual haya o no imagen de fondo. */}
      {!branding.hideStokaBranding && (
        <StokaBrandingBadge label="Hecho con Stoka LMS" className="absolute inset-x-0 bottom-4" />
      )}
    </div>
  );
}
