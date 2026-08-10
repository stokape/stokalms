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
import type { JWT } from 'next-auth/jwt';

// Pide un access_token nuevo a Keycloak usando el refresh_token — sin esto,
// el access_token (vive solo unos minutos, ver realm settings de Keycloak)
// expiraba y CUALQUIER pantalla del frontend empezaba a fallar con
// "Unauthorized" hasta cerrar sesion y volver a entrar manualmente. Se
// detecto probando la plataforma de verdad, con sesiones que duraban mas
// que la vida del token.
async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return { ...token, error: 'RefreshAccessTokenError' };
  }

  try {
    const response = await fetch(
      `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.AUTH_KEYCLOAK_ID!,
          client_secret: process.env.AUTH_KEYCLOAK_SECRET!,
          refresh_token: token.refreshToken,
        }),
      },
    );

    const refreshed = await response.json();
    if (!response.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      // Keycloak rota el refresh_token en cada uso por defecto — si esta
      // respuesta no trae uno nuevo, se reutiliza el anterior en vez de
      // perderlo.
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      idToken: refreshed.id_token ?? token.idToken,
      error: undefined,
    };
  } catch (error) {
    // "invalid_grant" es el caso ESPERADO (refresh_token vencido, o su
    // sesion en Keycloak ya no existe — ej. Keycloak se reinicio, o el
    // tiempo maximo de sesion del realm se cumplio): no es una falla real
    // del sistema, es simplemente "hay que volver a iniciar sesion". Se
    // registra como advertencia nada mas para no disparar el overlay de
    // errores de Next.js en desarrollo por algo que el propio flujo de
    // abajo ya maneja. Cualquier otro error (Keycloak caido, timeout de
    // red, etc.) si se registra como error real.
    const isExpectedSessionExpiry =
      typeof error === 'object' && error !== null && 'error' in error && error.error === 'invalid_grant';
    if (isExpectedSessionExpiry) {
      console.warn('[auth] Sesion de Keycloak vencida o invalidada, se pedira iniciar sesion de nuevo.');
    } else {
      console.error('[auth] No se pudo refrescar el access_token de Keycloak:', error);
    }
    // No se borra el accessToken viejo: que la proxima llamada al backend
    // falle con 401 real, y sea requireAccessToken() (ver lib/api.ts) quien
    // decida mandar a la persona a iniciar sesion de nuevo — mas simple que
    // duplicar esa logica aca.
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // NextAuth v5 solo confia en el Host del request entrante para construir
  // su propia redirect_uri de OAuth si corre en Vercel o si esto es
  // explicito — necesario para que el login funcione desde el subdominio
  // de CUALQUIER institucion (no solo un unico dominio fijo). Ver
  // AUTH_TRUST_HOST en .env.example.
  trustHost: true,
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
    // Keycloak nos entrega el access_token (+ refresh_token + hace cuanto
    // expira); lo copiamos dentro del token de sesion de NextAuth para
    // poder usarlo despues al llamar al backend, y para poder renovarlo.
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        // "id_token" (JWT distinto del access_token, pensado para IDENTIFICAR
        // a la persona, no para autorizar llamadas a una API) es lo que
        // Keycloak exige como "id_token_hint" al cerrar sesion de verdad (ver
        // app/(app)/layout.tsx, el boton "Cerrar sesion") — sin guardarlo
        // aca, se pierde apenas termina este login y no hay forma de pedirlo
        // de nuevo mas tarde.
        token.idToken = account.id_token;
        // "expires_at" que entrega Auth.js viene en SEGUNDOS epoch (asi lo
        // define OAuth2); se pasa a milisegundos aca para poder comparar
        // directo contra "Date.now()" mas abajo.
        token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined;
        return token;
      }

      // Todavia no expiro (con 10s de margen para el tiempo que tarda esta
      // misma llamada) — no hace falta pedir nada nuevo.
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires - 10_000) {
        return token;
      }

      return refreshAccessToken(token);
    },

    // "session" define que datos quedan accesibles cuando el resto de la
    // aplicacion llama a "auth()" (ver app/dashboard/page.tsx). Sin este
    // callback, "accessToken"/"idToken" quedarian atrapados dentro del JWT
    // interno de NextAuth y nunca llegarian al codigo de nuestras paginas.
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.idToken = token.idToken as string | undefined;
      // Si el refresh recien fallo (refresh_token vencido/revocado), se
      // propaga el error para que requireAccessToken() (ver lib/api.ts)
      // mande a la persona a iniciar sesion de nuevo en vez de reintentar
      // con un access_token que sabemos que ya no sirve.
      session.error = token.error as string | undefined;
      return session;
    },
  },
});
