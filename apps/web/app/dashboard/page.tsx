// ============================================================================
// dashboard/page.tsx — Primera pantalla protegida: prueba, de punta a
// punta, que el frontend puede llamar al backend en nombre de la persona
// que inicio sesion.
//
// Es un Server Component asincrono (Next.js permite "async" directamente en
// un componente de pagina): el HTML que se le manda al navegador ya viene
// con los datos, no hace falta un "loading spinner" ni un segundo viaje
// desde el navegador.
//
// Relacion con el resto del proyecto:
// - "auth()" (ver ../../auth.ts) lee la sesion actual, con el accessToken
//   que Keycloak entrego durante el login (ver el callback "jwt"/"session").
// - Ese mismo accessToken es el que apps/api/src/auth/jwt.strategy.ts valida
//   en el backend — por eso alcanza con mandarlo como
//   "Authorization: Bearer <token>", el backend no necesita saber nada de
//   NextAuth.
// - GET /api/v1/auth/me (ver apps/api/src/auth/auth.controller.ts) es
//   intencionalmente el endpoint MAS SIMPLE detras de autenticacion —
//   perfecto para esta primera pantalla de prueba.
// ============================================================================

import { redirect } from 'next/navigation';
import { auth } from '@/auth';

interface StokaUser {
  userId: string;
  userTenantId: string;
  tenantId: string;
  email: string;
  fullName: string;
}

export default async function DashboardPage() {
  const session = await auth();

  // Sin sesion (o sin accessToken dentro de la sesion), no tiene sentido
  // llamar al backend: lo mandamos directo a iniciar sesion.
  if (!session?.accessToken) {
    redirect('/');
  }

  const apiUrl = process.env.STOKA_API_URL ?? 'http://localhost:3001/api/v1';

  const response = await fetch(`${apiUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    // Nunca cachear una respuesta que depende de QUIEN esta pidiendola.
    cache: 'no-store',
  });

  if (!response.ok) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-red-600">
          El backend respondio {response.status} al pedir /auth/me. ¿Esta
          corriendo "npm run dev" dentro de apps/api?
        </p>
      </div>
    );
  }

  const user: StokaUser = await response.json();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Panel</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Esta informacion viene del backend (GET /api/v1/auth/me), no de la
        sesion local de NextAuth — confirma que el token realmente es
        aceptado por la API.
      </p>
      <pre className="w-full max-w-lg overflow-auto rounded-lg bg-zinc-100 p-4 text-sm dark:bg-zinc-900">
        {JSON.stringify(user, null, 2)}
      </pre>
      <a href="/" className="text-sm underline text-zinc-500">
        Volver al inicio
      </a>
    </div>
  );
}
