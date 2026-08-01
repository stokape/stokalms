// ============================================================================
// auth.ts — Configuracion central de autenticacion del frontend (NextAuth.js
// / Auth.js v5).
//
// POR QUE NextAuth.js Y NO UN FORMULARIO DE LOGIN PROPIO: implementar a mano
// el flujo OAuth2/OIDC "Authorization Code" (redirigir a Keycloak, recibir
// el codigo, intercambiarlo por tokens, guardarlos de forma segura, renovar
// el token cuando expira...) es un trabajo grande y sensible en seguridad.
// NextAuth.js ya lo hace de forma probada y correcta; nuestro trabajo es
// solo CONECTARLO con Keycloak (ver docs/architecture/adr/ADR-003-auth-identity.md).
//
// COMO ENCAJA CON EL BACKEND: cuando alguien inicia sesion aqui, Keycloak le
// entrega a NextAuth un "access_token". Ese MISMO token es el que
// apps/api/src/auth/jwt.strategy.ts valida en el backend — o sea, el
// frontend y el backend confian en el mismo Keycloak, cada uno con su
// propio "cliente" registrado alli (ver scripts/setup-keycloak.js:
// "stoka-web" para este frontend, "stoka-api" para el backend).
//
// Relacion con el resto del proyecto:
// - app/api/auth/[...nextauth]/route.ts expone esta configuracion como
//   rutas HTTP (login, logout, callback de Keycloak).
// - app/dashboard/page.tsx usa "auth()" (exportado aqui) para leer la
//   sesion actual y el access_token, y llamar al backend con el.
// - Variables de entorno usadas (ver .env.example de esta app): AUTH_SECRET,
//   AUTH_KEYCLOAK_ID, AUTH_KEYCLOAK_SECRET, AUTH_KEYCLOAK_ISSUER.
// ============================================================================

import NextAuth from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Sin pasarle clientId/clientSecret/issuer explicitos, Keycloak() los
    // toma automaticamente de las variables de entorno AUTH_KEYCLOAK_ID /
    // AUTH_KEYCLOAK_SECRET / AUTH_KEYCLOAK_ISSUER (convencion de NextAuth.js
    // v5: "AUTH_<NOMBRE_DEL_PROVEEDOR>_<CAMPO>"). Se dejan explicitos aqui
    // de todas formas por claridad, para que quede a la vista de donde sale
    // cada dato sin tener que adivinar la convencion.
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER,
    }),
  ],

  callbacks: {
    // "jwt" se ejecuta cada vez que NextAuth crea o actualiza la sesion
    // (guardada como JWT en una cookie). "account" solo viene poblado la
    // PRIMERA vez, justo despues del login exitoso — es el momento en que
    // Keycloak nos entrega el access_token; lo copiamos dentro del token
    // de sesion de NextAuth para poder usarlo despues al llamar al backend.
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    // "session" define que datos quedan accesibles cuando el resto de la
    // aplicacion llama a "auth()" (ver app/dashboard/page.tsx). Sin este
    // callback, "accessToken" quedaria atrapado dentro del JWT interno de
    // NextAuth y nunca llegaria al codigo de nuestras paginas.
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
  },
});
