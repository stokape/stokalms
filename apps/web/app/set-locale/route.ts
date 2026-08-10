// ============================================================================
// set-locale/route.ts — Guarda el idioma elegido (ver lib/locale.ts) y
// redirige de vuelta a la página de origen.
//
// Route Handler (no Server Action) A PROPOSITO: una Server Action + su
// redirect() se resuelve como una transición del ROUTER de Next.js (RSC,
// "text/x-component" con un header "x-action-redirect"), no como una
// navegación HTTP normal — en esta app, donde el tenant se resuelve por
// el Host real de cada request (ver tenant-context.middleware.ts), esa
// transición de router puede llegar a reusar de más el estado que ya
// tenía cacheado en vez de volver a resolver todo desde cero. Un Route
// Handler que devuelve un redirect HTTP real (302, ver NextResponse.redirect)
// no tiene ese problema: el navegador hace una navegación de documento
// COMPLETA, siempre. Ver components/LocaleSwitcher.tsx, que llama a esto
// con un <a> normal (no next/link) para que ni el propio Link intente
// una transición de cliente sobre esta ruta.
// ============================================================================

import { NextResponse, type NextRequest } from 'next/server';
import { LOCALE_COOKIE } from '@/lib/locale';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') === 'en' ? 'en' : 'es';
  // "path" siempre lo manda LocaleSwitcher con un valor propio de esta
  // app (nunca un input libre de quien visita) — igual se valida que
  // empiece con "/" para no poder redirigir nunca a otro dominio.
  const rawPath = searchParams.get('path') ?? '/';
  const path = rawPath.startsWith('/') ? rawPath : '/';

  // OJO: "request.url"/"request.nextUrl" NO reflejan el Host real que
  // mandó el navegador — Next.js los arma con un origen interno propio
  // (por seguridad, para no confiar en un Host que alguien podría
  // falsificar) — se comprobó armando el redirect con
  // "new URL(path, request.url)": siempre volvía a "localhost:3000" sin
  // importar el subdominio real de la institución. "request.headers",
  // en cambio, SÍ trae el header "Host" tal cual llegó — es la misma
  // fuente que ya usa tenant-context.middleware.ts (backend) para
  // resolver el tenant, así que es igual de confiable aquí.
  const host = request.headers.get('host') ?? new URL(request.url).host;
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const target = new URL(path, `${protocol}://${host}`);
  const response = NextResponse.redirect(target);
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
