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
// ============================================================================

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';
import { apiFetch } from '@/lib/api';

interface StokaUser {
  fullName: string;
  email: string;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.accessToken) {
    redirect('/');
  }

  // Si /auth/me falla (ej. el backend esta caido), no tiene sentido
  // bloquear TODA la navegacion por eso — se muestra la barra igual, sin
  // nombre, y cada pagina hija va a mostrar su propio error al intentar
  // cargar sus datos.
  let me: StokaUser | null = null;
  try {
    me = await apiFetch<StokaUser>(session.accessToken, '/auth/me');
  } catch {
    me = null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/cursos" className="text-lg font-semibold">
            Stoka LMS
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <Link href="/cursos" className="hover:underline">
              Cursos
            </Link>
            <Link href="/mis-matriculas" className="hover:underline">
              Mis matrículas
            </Link>
            <Link href="/plantillas-certificado" className="hover:underline">
              Plantillas de certificado
            </Link>
            <Link href="/configuracion-marca" className="hover:underline">
              Configuración de marca
            </Link>
            <Link href="/usuarios" className="hover:underline">
              Usuarios y roles
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {me && <span className="text-zinc-500">{me.fullName}</span>}
          <form
            action={async () => {
              'use server';
              await signOut();
            }}
          >
            <button type="submit" className="text-zinc-500 underline">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
