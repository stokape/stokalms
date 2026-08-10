'use server';

// ============================================================================
// session-actions.ts — Las DOS salidas que ofrece IdleSessionGuard cuando la
// sesion caduca por inactividad (ver components/IdleSessionGuard.tsx), mas
// el cierre de sesion normal del boton "Cerrar sesion" del header — se
// extrajeron a un archivo aparte para poder reusar EXACTAMENTE la misma
// logica desde ambos lugares, en vez de duplicarla.
// ============================================================================

import { redirect } from 'next/navigation';
import { auth, signIn, signOut } from '@/auth';

// Cierre de sesion COMPLETO: ademas de borrar la cookie de NextAuth, cierra
// tambien la sesion de SSO de Keycloak (logout "RP-initiated" del protocolo
// OIDC) — sin este paso extra, volver a "Iniciar sesion" te loguearia SOLO A
// LA MISMA persona sin pedir usuario/contrasena, algo confuso al alternar
// entre distintas cuentas de prueba en la misma computadora.
export async function cerrarSesionCompleta(_formData: FormData) {
  const session = await auth();
  const idToken = session?.idToken;
  await signOut({ redirect: false });

  const issuer = process.env.AUTH_KEYCLOAK_ISSUER;
  if (issuer && idToken) {
    const logoutUrl = new URL(`${issuer}/protocol/openid-connect/logout`);
    logoutUrl.searchParams.set('id_token_hint', idToken);
    logoutUrl.searchParams.set(
      'post_logout_redirect_uri',
      process.env.AUTH_URL ?? 'http://localhost:3000',
    );
    redirect(logoutUrl.toString());
  }
  redirect('/');
}

// Reingreso RAPIDO tras una sesion caducada por inactividad (NO por logout
// explicito): a proposito NO se toca la sesion de SSO de Keycloak, y se le
// pide el login con dos parametros extra en la URL de autorizacion:
//   - "prompt=login": obliga a Keycloak a mostrar el formulario de login y
//     pedir la contrasena de nuevo, aunque su propia cookie de SSO siga
//     vigente (si no se pasara esto, Keycloak loguearia en silencio sin
//     pedir nada, que es exactamente lo que NO queremos en una computadora
//     compartida que quedo inactiva).
//   - "login_hint=<email>": precompleta el campo de usuario en esa pantalla
//     de login, para que la persona solo tenga que escribir su contrasena.
export async function reingresarConContrasena(email: string | undefined, _formData: FormData) {
  await signIn(
    'keycloak',
    { redirectTo: '/' },
    { prompt: 'login', ...(email ? { login_hint: email } : {}) },
  );
}
