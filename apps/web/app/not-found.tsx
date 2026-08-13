// ============================================================================
// not-found.tsx (raíz) — Convención de Next.js: se muestra para CUALQUIER
// URL que no matchea ninguna ruta de toda la app (typo, enlace viejo,
// alguien probando URLs a mano) — sin este archivo, Next.js muestra su
// página 404 genérica sin marca. Server Component normal (a diferencia de
// error.tsx): no necesita "reset()", así que sí puede usar getLocale().
// ============================================================================

import { LinkButton } from '@/components/ui/LinkButton';
import { StokaMark } from '@/components/StokaLogo';
import { getLocale } from '@/lib/locale';

const TEXT = {
  es: {
    title: 'Página no encontrada',
    body: 'La dirección a la que intentaste entrar no existe o ya no está disponible.',
    home: 'Ir al inicio',
  },
  en: {
    title: 'Page not found',
    body: "The address you tried to open doesn't exist or isn't available anymore.",
    home: 'Go home',
  },
};

export default async function NotFound() {
  const t = TEXT[await getLocale()];

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <StokaMark className="h-12 w-12 opacity-70" />
      <p className="text-5xl font-bold text-muted">404</p>
      <h1 className="text-xl font-semibold">{t.title}</h1>
      <p className="max-w-sm text-sm text-muted">{t.body}</p>
      <LinkButton href="/" className="mt-2">
        {t.home}
      </LinkButton>
    </div>
  );
}
