// ============================================================================
// lib/locale.ts — Idioma elegido para las páginas PÚBLICAS (home,
// /entrar, /registro-institucion) — ver components/LocaleSwitcher.tsx.
//
// Guardado en una cookie simple, SIN prefijo de idioma en la URL
// (/en/..., /es/...): para 3 páginas no ameritaba reestructurar el
// enrutado completo de la app en un segmento "[locale]" (eso recién
// tendría sentido si se traduce la aplicación entera, no solo la parte
// pública) — ver la nota en app/PlatformLanding.tsx.
// ============================================================================

import { cookies } from 'next/headers';

export type Locale = 'es' | 'en';

export const LOCALE_COOKIE = 'locale';

// Nunca falla ni devuelve "undefined": sin cookie (primera visita) cae al
// español, que es el idioma en el que arrancó toda la plataforma.
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return value === 'en' ? 'en' : 'es';
}
