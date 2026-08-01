// ============================================================================
// page.tsx (raiz "/") — Landing minima: si ya hay sesion, ofrece ir al
// panel; si no, ofrece iniciar sesion contra Keycloak.
//
// Es un "Server Component" (no lleva "use client" arriba): corre en el
// servidor de Next.js en cada visita, por eso puede llamar directamente a
// "auth()" (ver ../auth.ts) para saber si ya hay sesion, sin necesitar una
// llamada adicional desde el navegador.
// ============================================================================

import { auth, signIn, signOut } from '@/auth';

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col flex-1 items-center justify-center gap-6 bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
        Stoka LMS
      </h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Plataforma de gestion de aprendizaje multi-tenant.
      </p>

      {session ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-zinc-800 dark:text-zinc-200">
            Sesion iniciada como <strong>{session.user?.email ?? session.user?.name}</strong>
          </p>
          {/* Antes apuntaba a "/dashboard" (la pantalla de PRUEBA con el
             JSON crudo de /auth/me) — ahora que existen pantallas de
             negocio reales (ver app/(app)/), el destino natural despues de
             iniciar sesion es "Cursos". "/dashboard" sigue existiendo
             (para quien necesite confirmar que el token es aceptado por
             el backend), pero deliberadamente SIN enlace desde el menu de
             negocio: mezclada con la navegacion normal, esa pantalla de
             JSON crudo confundia a quien no sabe que es una pantalla
             tecnica (se detecto probando con un usuario real). Se llega
             a ella escribiendo la URL a mano. */}
          <a
            href="/cursos"
            className="rounded-full bg-foreground px-6 py-3 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Entrar a la plataforma
          </a>
          {/* Un formulario que llama a un Server Action es el patron
             recomendado por NextAuth.js v5 para cerrar sesion sin
             necesitar un componente de cliente ("use client"). */}
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
        <form
          action={async () => {
            'use server';
            // "keycloak" es el id del proveedor configurado en auth.ts.
            // signIn() redirige al navegador hacia la pantalla de login de
            // Keycloak; al volver (callback), NextAuth crea la sesion.
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
      )}
    </div>
  );
}
