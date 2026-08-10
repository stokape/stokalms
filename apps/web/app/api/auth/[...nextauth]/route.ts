// ============================================================================
// route.ts — Expone la configuracion de auth.ts como rutas HTTP reales.
//
// El nombre de carpeta "[...nextauth]" (con corchetes y "...") es una ruta
// "catch-all" de Next.js: captura CUALQUIER sub-ruta bajo /api/auth/, por
// ejemplo /api/auth/signin, /api/auth/callback/keycloak, /api/auth/signout,
// etc. NextAuth.js internamente decide que hacer segun cual de esas
// sub-rutas se llamo — nosotros no escribimos esa logica, solo la
// conectamos re-exportando "handlers" desde ../../../../auth.ts.
//
// BUG REAL ENCONTRADO Y CORREGIDO ACA (no en auth.ts): @auth/core arma el
// "redirect_uri" que le manda a Keycloak en el intercambio de token (y
// cualquier otra URL interna que necesite) a partir de "request.url" — ver
// node_modules/@auth/core/lib/index.js ("url: request.url") y
// node_modules/@auth/core/lib/utils/providers.js (usa ESE url para calcular
// "callbackUrl" de cada proveedor). El problema: un "NextRequest" de un
// Route Handler de Next.js NUNCA refleja el Host real de la institucion en
// su propiedad ".url" — siempre devuelve un origen "seguro" fijo (aca,
// "http://localhost:3000"), sin importar "trustHost: true" (ese flag
// gobierna una comprobacion DISTINTA, la de "assert.js", no esta). Mismo
// comportamiento que ya se habia encontrado y corregido en
// app/set-locale/route.ts.
//
// Esto explicaba el bug abierto de "invalid_grant: Incorrect redirect_uri"
// entrando desde CUALQUIER subdominio de institucion que no fuera
// "localhost:3000" (coincidencia: ESE es justo el origen fijo que
// "request.url" devuelve por default en este entorno): el PRIMER paso del
// login (armado por una Server Action en InstitutionHome.tsx, que SI lee el
// Host real via headers()) le mandaba a Keycloak el redirect_uri correcto
// ("http://sanmartin.localhost:3000/..."), pero el SEGUNDO paso — el
// intercambio de codigo por token, que pasa por ESTE Route Handler — le
// mandaba uno distinto ("http://localhost:3000/..."), y Keycloak rechaza el
// intercambio si no coinciden exactos.
//
// La solucion: antes de que el request le llegue a NextAuth, se reescribe
// su URL para que el host (y protocolo, via "x-forwarded-proto" detras de
// Caddy en produccion) sea el REAL — headers().get("host") SI refleja el
// Host verdadero (confirmado ya en set-locale/route.ts). Mismo patron que
// next-auth usa por su cuenta para la variable de entorno "AUTH_URL" (ver
// next-auth/lib/env.js, "reqWithEnvURL"), aplicado aca a mano porque esta
// app tiene MUCHOS origenes validos (uno por institucion), no uno solo fijo
// por variable de entorno.
// ============================================================================

import { NextRequest } from 'next/server';
import { handlers } from '@/auth';
import { trackEvent } from '@/lib/analytics';

// "login_completed" (ver lib/analytics.ts): esta ruta atiende TODAS las
// sub-rutas de NextAuth (signin, session, csrf, signout...), no solo el
// callback — solo cuenta como login completado cuando la sub-ruta es
// justo "/callback/*" Y la respuesta es un redirect SIN "error=" en el
// destino (Keycloak/@auth-core mandan ahi mismo cuando algo salio mal,
// ver la nota grande de arriba sobre el bug de redirect_uri que esto
// mismo ayudo a diagnosticar).
async function trackIfLoginCompleted(request: NextRequest, response: Response): Promise<void> {
  if (!request.nextUrl.pathname.includes('/callback/')) {
    return;
  }
  const location = response.headers.get('location');
  if (!location || location.includes('error=')) {
    return;
  }
  void trackEvent('login_completed', { host: request.headers.get('host') ?? undefined });
}

function withRealHost(request: NextRequest): NextRequest {
  const host = request.headers.get('host');
  if (!host) {
    return request;
  }

  const url = new URL(request.url);
  const protocol = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');
  const fixed = `${protocol}://${host}${url.pathname}${url.search}`;
  if (fixed === request.url) {
    return request;
  }

  // "request" como segundo argumento (no un objeto RequestInit a mano):
  // NextRequest lo acepta como fuente de la que copiar method/headers/body/
  // cookies — el mismo patron exacto que usa next-auth internamente (ver la
  // nota de arriba, "reqWithEnvURL").
  return new NextRequest(fixed, request);
}

export async function GET(request: NextRequest) {
  const fixedRequest = withRealHost(request);
  const response = await handlers.GET(fixedRequest);
  void trackIfLoginCompleted(fixedRequest, response);
  return response;
}

export async function POST(request: NextRequest) {
  return handlers.POST(withRealHost(request));
}
