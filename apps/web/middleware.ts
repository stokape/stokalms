// ============================================================================
// middleware.ts — Cabeceras de seguridad HTTP para TODA respuesta de esta
// app (todas las paginas Server Component, no los assets estaticos — ver
// "matcher" al final). Va en middleware (no en next.config.ts) porque el
// Content-Security-Policy necesita un "nonce" ALEATORIO POR REQUEST (para
// poder seguir usando 'strict-dynamic' en vez de la alternativa mas debil,
// "script-src 'unsafe-inline'") — next.config.ts se evalua una sola vez al
// iniciar el servidor, no puede generar nada distinto en cada request.
//
// COMO FUNCIONA EL NONCE: se genera un valor aleatorio, se manda en la
// cabecera de respuesta "Content-Security-Policy" (dentro de
// script-src 'nonce-xxx') Y en una cabecera de REQUEST "x-nonce" — Next.js
// (desde la v13.4) detecta automaticamente ese nonce y lo agrega el mismo a
// sus propios <script> de inicio/hydration, asi el navegador los deja
// ejecutar (matchean el nonce) pero CUALQUIER OTRO script inyectado por un
// ataque XSS (que no puede adivinar un nonce aleatorio de 128 bits) queda
// bloqueado. Es el patron oficial documentado en la guia de CSP de
// Next.js App Router.
//
// 'strict-dynamic': un script cargado con el nonce correcto puede a su vez
// cargar otros scripts (los chunks de Next.js lo necesitan) SIN que cada
// uno tenga que llevar su propio nonce — mas estricto y mas simple que
// mantener una lista de dominios permitidos a mano.
// ============================================================================

import { NextResponse, type NextRequest } from 'next/server';

// Origen del bucket de archivos (MinIO/S3) desde donde se sirven logos y
// fondos de cada institucion (URLs firmadas, ver tenant.service.ts) — ver
// STORAGE_PUBLIC_ORIGIN en .env.example. Sin esto en "img-src", el
// navegador bloquearia esas imagenes.
const STORAGE_ORIGIN = process.env.STORAGE_PUBLIC_ORIGIN ?? 'http://localhost:9000';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const cspDirectives = [
    // Regla de respaldo para cualquier tipo de recurso no cubierto abajo.
    `default-src 'self'`,
    // 'unsafe-inline' queda IGNORADO por navegadores modernos en cuanto
    // detectan un nonce en la misma directiva (asi lo exige la spec de
    // CSP2+) — se deja igual como respaldo para navegadores viejos que no
    // entienden nonces, que si lo respetarian.
    //
    // 'unsafe-eval' SOLO en desarrollo: React lo usa para reconstruir
    // stack traces legibles en su overlay de errores / Fast Refresh (se
    // detecto probando esto mismo: sin esta linea, la consola tira "eval()
    // is not supported..." en dev) — el propio mensaje de React aclara
    // "React will never use eval() in production mode", asi que en
    // produccion esta linea desaparece y el CSP queda mas estricto todavia.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'${IS_PRODUCTION ? '' : " 'unsafe-eval'"}`,
    // Los componentes de esta app usan bastante el prop "style={{...}}" de
    // React (color de fondo elegido, miniaturas de plantillas de
    // certificado escaladas, etc.), que compila a atributos style="" en el
    // HTML — bloquearlos sin nonce rompería esas pantallas. El riesgo real
    // de XSS vía CSS puro es mucho menor que vía <script>, por eso aquí se
    // acepta el trade-off (a diferencia de script-src, que NO lleva
    // 'unsafe-inline' efectivo).
    `style-src 'self' 'unsafe-inline'`,
    // "data:" -> el iconito de flecha de los <select> (ver field-styles.ts)
    // va embebido como SVG en base64, no como archivo aparte.
    // "blob:" -> la vista previa en vivo de un logo/fondo recien elegido,
    // ANTES de subirlo (ver BrandingStudio.tsx, URL.createObjectURL).
    `img-src 'self' data: blob: ${STORAGE_ORIGIN}`,
    `font-src 'self'`,
    `connect-src 'self'`,
    // Ningun <object>/<embed> (Flash y similares, superficie de ataque
    // vieja sin ningun uso legitimo en esta app).
    `object-src 'none'`,
    // Nadie mas que esta misma app puede embeberse a si misma en un
    // <iframe> — la vista previa de plantillas de certificado usa un
    // <iframe> DENTRO de esta app (para mostrar SU contenido, sandboxed),
    // no al reves.
    `frame-ancestors 'none'`,
    `frame-src 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    // En desarrollo el sitio se sirve por http://localhost a proposito
    // (Keycloak/MinIO tambien) — forzar "https" aca rompería esas cargas
    // (el navegador reescribiría cada URL http:// a https://, que no
    // existe en dev). Solo tiene sentido una vez que TODO corre bajo TLS.
    ...(IS_PRODUCTION ? ['upgrade-insecure-requests'] : []),
  ];
  const csp = cspDirectives.join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set('Content-Security-Policy', csp);
  // Bloquea que esta app se muestre dentro de un <iframe> de otro sitio
  // (Clickjacking) — "frame-ancestors" de arriba es el equivalente moderno,
  // pero se manda igual esta cabecera para navegadores que todavia no lo
  // soportan.
  response.headers.set('X-Frame-Options', 'DENY');
  // Evita que el navegador intente "adivinar" el tipo de un archivo
  // distinto al que el servidor declaro (MIME sniffing) — sin esto, un
  // archivo subido como recurso de leccion con contenido ambiguo podria
  // interpretarse como HTML/JS ejecutable en vez del tipo real.
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // No mandar la URL completa de origen como "Referer" a otros sitios
  // (ej. al hacer clic en un link externo) — solo el origen, nunca la ruta
  // completa (que podria incluir un codigo de verificacion de certificado
  // u otro dato sensible en la URL).
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Esta app no usa camara/microfono/geolocalizacion/etc. — se lo dice
  // explicitamente al navegador para que ni siquiera un XSS que lograra
  // ejecutar JS pudiera pedir permiso para usarlos.
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()',
  );
  // HSTS: le dice al navegador "para este dominio, ni se te ocurra probar
  // con http:// de nuevo por un año" — SOLO tiene sentido una vez que la
  // app corre de verdad bajo HTTPS en todas partes (en dev, sobre
  // http://localhost, los navegadores la ignoran igual, pero se manda solo
  // en produccion para no dejar rastros confusos en desarrollo).
  if (IS_PRODUCTION) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Todo MENOS los assets estaticos de Next.js y los archivos comunes de
    // /public (favicon, robots.txt...) — ahi no hace falta un nonce nuevo
    // en cada request, y evita trabajo de mas en cada chunk .js/.css.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
