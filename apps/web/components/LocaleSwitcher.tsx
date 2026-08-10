// ============================================================================
// LocaleSwitcher.tsx — "ES / EN" para las páginas públicas (ver
// lib/locale.ts). Cada opción es un <a> HTML COMÚN (no next/link) a
// /set-locale — a propósito, para que ni siquiera el propio router de
// Next.js intente una transición de cliente sobre este cambio; ver la
// nota extensa en app/set-locale/route.ts sobre por qué eso importa en
// una app que resuelve el tenant por el Host real de cada request.
// ============================================================================

import type { Locale } from '@/lib/locale';

export function LocaleSwitcher({ locale, path }: { locale: Locale; path: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium">
      <LocaleOption label="ES" value="es" active={locale === 'es'} path={path} />
      <span className="text-muted">/</span>
      <LocaleOption label="EN" value="en" active={locale === 'en'} path={path} />
    </div>
  );
}

function LocaleOption({
  label,
  value,
  active,
  path,
}: {
  label: string;
  value: Locale;
  active: boolean;
  path: string;
}) {
  if (active) {
    return <span className="text-foreground">{label}</span>;
  }
  return (
    <a href={`/set-locale?locale=${value}&path=${encodeURIComponent(path)}`} className="text-muted hover:text-foreground">
      {label}
    </a>
  );
}
