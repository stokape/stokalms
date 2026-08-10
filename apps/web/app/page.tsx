// ============================================================================
// page.tsx (raiz "/") — Home PUBLICO. Se ve distinto segun por donde se
// entre:
//   - Por el subdominio de una institucion YA aprobada (ej.
//     "techfuturo.stokalms.local"): ver InstitutionHome.tsx — SU logo, SU
//     marca, el boton de iniciar sesion, nada de "inscribi tu
//     institucion" (esa institucion ya existe).
//   - Por el dominio raiz de la plataforma (sin ningun tenant resuelto, ver
//     la nota en tenant.service.ts sobre "getPublicInfo"): ver
//     PlatformLanding.tsx — la landing real de Stoka LMS, con el boton
//     para inscribir una institucion nueva.
//
// Sigue siendo un Server Component asincrono: corre en el servidor de
// Next.js en cada visita.
// ============================================================================

import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import { apiFetchPublic, getPermissions, can } from '@/lib/api';
import { getLocale } from '@/lib/locale';
import { trackEvent } from '@/lib/analytics';
import { InstitutionHome, type PublicTenantInfo } from './InstitutionHome';
import { PlatformLanding } from './PlatformLanding';

// Solo describe el caso SIN tenant resuelto (PlatformLanding, ver mas
// abajo) — con un tenant resuelto, se deja el default de
// app/layout.tsx (una institucion real no necesita este SEO comercial de
// Stoka LMS). La seccion de Planes y precios ahora vive DENTRO de esta
// misma pagina (ver "id=precios" en PlatformLanding.tsx, en vez de una
// ruta /precios aparte) — por eso el titulo/descripcion de aca mencionan
// precios directamente, sin repetir la misma palabra clave sin necesidad.
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await apiFetchPublic<PublicTenantInfo | null>('/tenant/public').catch(() => null);
  if (tenant) return {};

  return {
    title: 'Stoka LMS — Plataforma LMS para empresas, academias e institutos',
    description:
      'Stoka LMS es la plataforma de aprendizaje online para empresas, academias e institutos que necesitan administrar su capacitación. Cursos, certificados, evaluaciones y planes y precios de Stoka LMS por usuarios activos mensuales.',
  };
}

export default async function Home() {
  const [rawSession, tenant, locale, host] = await Promise.all([
    auth(),
    // Si el backend no esta disponible, se prefiere mostrar la landing
    // GENERICA (degradacion cuidadosa) antes que romper toda la pagina de
    // inicio por un problema que ni siquiera es de esta institucion.
    apiFetchPublic<PublicTenantInfo | null>('/tenant/public').catch(() => null),
    getLocale(),
    headers().then((h) => h.get('host') ?? undefined),
  ]);

  // "session.error" (ver auth.ts, refreshAccessToken) significa que el
  // refresh_token ya no sirve (sesion de Keycloak vencida/invalidada) —
  // NextAuth igual devuelve un objeto "session" no-nulo en ese caso, asi
  // que si esta pantalla lo tratara como "con sesion" sin mas, mostraria
  // "Entrar a la plataforma" (InstitutionHome) o "Ir al panel"
  // (PlatformLanding) — un boton que SIEMPRE rebota: la pantalla de
  // destino llama a requireAccessToken() (ver lib/api.ts), ve el mismo
  // error, y redirige de vuelta aca. Sin este filtro, alguien con una
  // sesion vencida queda atrapado en ese ciclo (Cursos -> Home -> Cursos)
  // sin ninguna pista de que hace falta volver a iniciar sesion — se
  // detecto asi, viendo los logs del servidor con el patron repetido. Al
  // tratarlo aca como "sin sesion", esta pantalla (y las que reciben este
  // "session" de aca) vuelve a mostrar el boton de "Iniciar sesion" real.
  const session = rawSession?.error ? null : rawSession;

  if (!tenant) {
    // Sin "await": una fila de metricas perdida no vale la pena retrasar
    // la landing por ella (ver la nota grande en lib/analytics.ts).
    void trackEvent('landing_view', { host });
    return <PlatformLanding session={session} locale={locale} />;
  }

  // El modo mantenimiento (ver /mantenimiento, requiere "tenant:edit" —
  // Super Admin / Administrador de entidad) no bloquea a ESE mismo rol:
  // necesitan poder entrar igual para desactivarlo. Para cualquier otra
  // sesion (o sin sesion) InstitutionHome reemplaza el contenido normal
  // por el aviso.
  const permissions = session?.accessToken ? await getPermissions(session.accessToken) : new Set<string>();
  const canBypassMaintenance = can(permissions, 'tenant', 'edit');

  return (
    <InstitutionHome tenant={tenant} session={session} canBypassMaintenance={canBypassMaintenance} />
  );
}
