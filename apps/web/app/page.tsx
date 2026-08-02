// ============================================================================
// page.tsx (raiz "/") — Home PUBLICO. Se ve distinto segun por donde se
// entre:
//   - Por el subdominio de una institucion YA aprobada (ej.
//     "techfuturo.stokalms.local"): muestra SU logo, nombre y fondo (ver
//     GET /tenant/public, tenant.controller.ts) y el boton de iniciar
//     sesion — nada de "inscribi tu institucion", porque esa institucion
//     ya existe.
//   - Por el dominio raiz de la plataforma (sin ningun tenant resuelto,
//     ver la nota en tenant.service.ts sobre "getPublicInfo"): landing
//     generica de Stoka LMS, con el boton para inscribir una institucion
//     nueva.
//
// Sigue siendo un Server Component asincrono: corre en el servidor de
// Next.js en cada visita.
// ============================================================================

import Link from 'next/link';
import { auth, signIn, signOut } from '@/auth';
import { apiFetchPublic } from '@/lib/api';

interface TenantBranding {
  logoUrl?: string;
  backgroundColor?: string;
  backgroundImageUrl?: string;
}

interface PublicTenantInfo {
  name: string;
  branding: TenantBranding;
}

export default async function Home() {
  const [session, tenant] = await Promise.all([
    auth(),
    // Si el backend no esta disponible, se prefiere mostrar la landing
    // GENERICA (degradacion prolija) antes que romper toda la pagina de
    // inicio por un problema que ni siquiera es de esta institucion.
    apiFetchPublic<PublicTenantInfo | null>('/tenant/public').catch(() => null),
  ]);

  const branding = tenant?.branding ?? {};
  const backgroundStyle: React.CSSProperties = branding.backgroundImageUrl
    ? {
        backgroundImage: `url(${branding.backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : branding.backgroundColor
      ? { backgroundColor: branding.backgroundColor }
      : {};

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center dark:bg-black"
      style={backgroundStyle}
    >
      {branding.logoUrl && (
        // Logo con URL propia de cada institucion: no se puede usar
        // next/image sin declarar de antemano cada dominio remoto posible
        // (una institucion nueva podria alojar su logo en CUALQUIER
        // servidor) — una <img> comun es la opcion correcta aca.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={branding.logoUrl}
          alt={`Logo de ${tenant?.name ?? 'la institucion'}`}
          className="h-20 w-auto object-contain"
        />
      )}

      <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
        {tenant?.name ?? 'Stoka LMS'}
      </h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        {tenant
          ? 'Plataforma de gestión de aprendizaje.'
          : 'Plataforma de gestión de aprendizaje multi-tenant.'}
      </p>

      {session ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-zinc-800 dark:text-zinc-200">
            Sesion iniciada como <strong>{session.user?.email ?? session.user?.name}</strong>
          </p>
          {/* "/dashboard" sigue existiendo (para quien necesite confirmar
             que el token es aceptado por el backend), pero deliberadamente
             SIN enlace desde el menu de negocio ni desde aca: mezclada con
             la navegacion normal, esa pantalla de JSON crudo confundia a
             quien no sabe que es una pantalla tecnica (se detecto probando
             con un usuario real). Se llega a ella escribiendo la URL a mano. */}
          <a
            href="/cursos"
            className="rounded-full bg-foreground px-6 py-3 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Entrar a la plataforma
          </a>
          <form
            action={async () => {
              'use server';
              await signOut();
            }}
          >
            <button type="submit" className="text-sm text-zinc-500 underline">
              Cerrar sesion
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <form
            action={async () => {
              'use server';
              await signIn('keycloak');
            }}
          >
            <button
              type="submit"
              className="rounded-full bg-foreground px-6 py-3 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Iniciar sesion
            </button>
          </form>

          {/* Solo tiene sentido inscribir una institucion NUEVA cuando
             todavia no hay ninguna resuelta por este dominio — si ya
             estas en el subdominio de una institucion existente, no hay
             "otra institucion" que inscribir desde aca. */}
          {!tenant && (
            <Link href="/registro-institucion" className="text-sm text-zinc-500 underline">
              ¿Sos una institución nueva? Inscribite acá
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
