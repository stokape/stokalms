// ============================================================================
// next-auth.d.ts — "Amplia" los tipos de NextAuth.js para que TypeScript
// sepa que nuestra sesion tiene un campo extra "accessToken".
//
// Por que hace falta: la libreria NextAuth.js define su propio tipo
// "Session" (sin el campo accessToken, porque eso es algo que NOSOTROS
// agregamos en auth.ts, callback "session"). Sin este archivo, TypeScript
// marcaria error en cualquier lugar que intente leer "session.accessToken"
// (ver app/dashboard/page.tsx), porque no formaria parte del tipo oficial.
//
// "declare module" le dice a TypeScript: "cuando alguien importe 'next-auth',
// combina ESTA definicion con la original" — es la forma estandar de
// extender tipos de una libreria externa sin tener que copiarla entera.
// ============================================================================

import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    // Ver auth.ts (callback "jwt") y app/(app)/layout.tsx (boton "Cerrar
    // sesion"): Keycloak lo exige como "id_token_hint" para cerrar tambien
    // su propia sesion de SSO, no solo la cookie de NextAuth.
    idToken?: string;
    user?: DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    idToken?: string;
  }
}
