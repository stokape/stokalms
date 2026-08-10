// ============================================================================
// temp-credentials.ts — Muestra una contraseña temporal de Keycloak UNA SOLA
// VEZ despues de crear/aprobar una institucion (ver
// tenant-registration.service.ts, "provisionTenant") sin que pase NUNCA por
// una URL — ahi quedaria en logs de acceso del servidor/proxy y en el
// historial del navegador. En su lugar, una Server Action la deja en una
// cookie de corta vida justo antes de redirigir, y el Server Component de
// destino la lee una vez.
//
// httpOnly (JS del navegador no puede leerla) + "path" acotado a
// "/admin-plataforma" (nunca viaja en requests a ninguna otra parte de la
// app) + "maxAge" de 60s (esto NO es una sesion, es un mensaje de una sola
// pantalla) — no hace falta borrarla a mano: un Server Component no puede
// tocar cookies durante el render (solo Server Actions/Route Handlers), y
// para cuando alguien la mire dos veces ya expiro sola.
// ============================================================================

import { cookies } from 'next/headers';

const COOKIE_NAME = 'stoka_temp_credentials';

export interface TempCredentials {
  domain: string;
  temporaryPassword: string | null;
  keycloakWarning: string | null;
}

export async function setTempCredentialsCookie(data: TempCredentials): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60,
    path: '/admin-plataforma',
  });
}

export async function readTempCredentialsCookie(): Promise<TempCredentials | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as TempCredentials;
  } catch {
    return null;
  }
}
