import type { Metadata, Viewport } from "next";
import { Geist_Mono, Raleway } from "next/font/google";
import { headers } from "next/headers";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiFetchPublic } from "@/lib/api";
import { derivePrimaryPalette } from "@/lib/color";
import "./globals.css";

// Forma minima de "/tenant/public" que este layout necesita — el resto de
// sus campos (maintenanceMode, etc.) los usan otras pantallas (ver
// app/page.tsx, (app)/layout.tsx), no hace falta repetirlos aca.
interface PublicTenantBranding {
  branding?: { faviconUrl?: string; primaryColor?: string };
}

// Se llama UNA sola vez por request aunque tanto "generateMetadata" como
// "RootLayout" lo invoquen (ver mas abajo): Next.js memoiza automaticamente
// llamadas identicas a "fetch" (la que usa apiFetchPublic) dentro del
// mismo request — no hace falta cachearlo a mano aca.
async function getTenantBranding(): Promise<PublicTenantBranding | null> {
  try {
    return await apiFetchPublic<PublicTenantBranding | null>('/tenant/public');
  } catch {
    // Backend caido / sin tenant resuelto: se sigue viendo la app con el
    // favicon y los colores por defecto de Stoka — nunca vale la pena
    // romper TODA la aplicacion por esto.
    return null;
  }
}

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Tipografía oficial del brand kit de Stoka LMS ("LMS"/"Educación
// virtual" en el lockup del logo — ver components/StokaLogo.tsx) — ahora
// la fuente de TODA la app (antes Geist Sans), no solo del logo: ver
// "--font-sans"/"--font-display" en globals.css. Pesos: 400/500 para
// texto de cuerpo, 600/700 para botones/énfasis, 800 para titulares
// grandes de la landing (antes cubierto por Fraunces, retirada). Igual
// que antes, "next/font/google" la descarga una vez en el build y la
// sirve desde este mismo origen — no hace falta tocar el CSP
// (middleware.ts, connect-src/font-src 'self').
const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// "generateMetadata" (en vez del "export const metadata" estatico de
// antes) porque el favicon ahora depende de QUE institucion este viendo la
// pagina (ver Tenant.branding.faviconKey, tenant.service.ts) — necesita
// poder leer el Host del request (via apiFetchPublic -> headers()), algo
// que un objeto estatico no puede hacer. Sin "icons" en el resultado (ej.
// esta institucion no subio favicon propio, o no hay tenant resuelto),
// Next.js cae solo al favicon de archivo de siempre (app/icon.png, el de
// Stoka) — no hace falta repetirlo aca a mano.
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantBranding();
  const faviconUrl = tenant?.branding?.faviconUrl;

  return {
    title: "Stoka LMS",
    description: "Plataforma de gestion de aprendizaje multi-tenant",
    // SIEMPRE se declara "icons" explicito (nunca se deja sin definir):
    // dejarlo undefined cuando no hay favicon propio hace que Next.js
    // agregue el ICONO DE ARCHIVO (app/icon.png) COMO EXTRA, sin
    // reemplazar el que ya se haya resuelto aca — se comprobo en la
    // practica que con ambos <link rel="icon"> presentes a la vez, el
    // navegador no garantiza cual de los dos usa. Declarandolo siempre
    // (con el propio app/icon.png como default explicito) hay un unico
    // <link> y no hay ambiguedad.
    //
    // NOTA: "app/favicon.ico" (a diferencia de "app/icon.png") NO se puede
    // suprimir asi — Next.js SIEMPRE lo agrega ademas de "icons", sin
    // importar lo que devuelva "generateMetadata" (es una convencion mas
    // privilegiada, pensada para el fallback implicito que hacen los
    // navegadores viejos pidiendo "/favicon.ico" directo). Por eso ese
    // archivo se borro del proyecto — con dos <link rel="icon"> compitiendo,
    // el favicon por institucion no se aplicaba de forma confiable. Un
    // navegador moderno (todos los que soporta esta app) respeta el <link>
    // de aca sin necesitar ademas un "/favicon.ico" fisico.
    icons: { icon: faviconUrl || '/icon.png' },
  };
}

// Color de la barra de direcciones/estado en navegadores mobile que lo
// soportan (Android Chrome, iOS Safari) — un par claro/oscuro, mismos
// valores que "--surface" en globals.css, para que la barra del sistema
// se sienta parte de la app en vez de quedar gris por defecto.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#16283c" },
  ],
};

// Fija el tema (claro/oscuro) en el <html> ANTES de que el navegador pinte
// nada — un <script> normal (sin "async"/"defer") se ejecuta en el orden en
// que aparece, así que puesto primero dentro de <body> corre antes que el
// resto del contenido llegue a pintarse, evitando el "parpadeo" de iniciar
// en un tema para saltar al otro medio segundo después. Ver
// components/ThemeToggle.tsx (quien lo cambia después) y globals.css
// (quien define qué significa visualmente cada valor de "data-theme").
const THEME_BOOTSTRAP_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // El Content-Security-Policy de esta app (ver middleware.ts) exige que
  // TODO <script> en línea lleve el nonce de ESTE request exacto — sin
  // él, el navegador bloquea el script de inicio de arriba y el tema
  // vuelve a iniciar siempre en claro (con el parpadeo que se quería
  // evitar). Mismo nonce que Next.js ya les aplica solo a sus propios
  // scripts de hidratación, ver la nota extensa en middleware.ts.
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  // Color de MARCA de la institucion activa (ver Tenant.branding.primaryColor,
  // BrandingStudio.tsx) — sin valor propio, esta institucion (o el dominio
  // raiz de la plataforma, sin tenant resuelto) usa el Azul Stoka por
  // defecto de globals.css, sin necesidad de ningun <style> extra.
  const tenant = await getTenantBranding();
  const palette = tenant?.branding?.primaryColor
    ? derivePrimaryPalette(tenant.branding.primaryColor)
    : null;

  return (
    // suppressHydrationWarning: el script de arriba modifica "data-theme"
    // en el <html> antes de que React hidrate — sin este aviso suprimido,
    // React marcaría error por ese único atributo que él no puso (no hay
    // forma de que el render del SERVIDOR sepa de antemano el tema
    // elegido en el navegador de cada persona).
    <html
      lang="es"
      suppressHydrationWarning
      className={`${raleway.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* suppressHydrationWarning (a nivel de ESTE nodo, no alcanza con
           el del <html>): por seguridad, todo navegador oculta el nonce
           real a cualquier lectura por JS/DOM despues de parsear la
           pagina (para que un XSS no pueda robarlo y reusarlo en otro
           script) — React lo detecta como "no coincide con lo que rendericé"
           y avisa, aunque el <script> ya se haya ejecutado bien (si no,
           el tema ni se aplicaria). Mismo motivo por el que Next.js nunca
           expone este aviso para SUS PROPIOS scripts con nonce. */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
        {/* Sobreescribe "--primary"/"--primary-hover"/"--primary-foreground"
           (definidas en globals.css) con el color de marca de esta
           institucion. Va DESPUES del <link> del CSS compilado (que Next.js
           siempre pone en <head>, antes que <body>), asi que a igual
           especificidad de selector ("`:root`" vs "`:root`") esta regla,
           por venir despues en el documento, es la que gana — sin
           necesidad de "!important". No necesita nonce: el CSP de esta app
           (ver middleware.ts) permite "style-src 'unsafe-inline'" (a
           diferencia de los scripts, que si exigen nonce). */}
        {palette && (
          <style
            dangerouslySetInnerHTML={{
              __html: `:root{--primary:${palette.primary};--primary-hover:${palette.primaryHoverLight};--primary-foreground:${palette.primaryForeground}}:root[data-theme='dark']{--primary:${palette.primary};--primary-hover:${palette.primaryHoverDark};--primary-foreground:${palette.primaryForeground}}`,
            }}
          />
        )}
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
