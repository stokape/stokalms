'use client';

// ============================================================================
// ThemeToggle.tsx — El interruptor de tema claro/oscuro. Flotante y fijo en
// toda la app (ver app/layout.tsx, se renderiza UNA vez ahí, no en cada
// pantalla) para que esté disponible sin importar por dónde se entre: la
// landing pública, el login, o cualquier pantalla de negocio.
//
// Por qué es un Client Component (uno de los pocos, junto con
// IdleSessionGuard, en una app que es casi enteramente Server Components):
// cambiar el tema es una preferencia puramente del NAVEGADOR de esa
// persona (ver localStorage más abajo) — no hay ningún dato que pedirle
// al servidor.
//
// "useSyncExternalStore" en vez de useState+useEffect: el tema real vive
// AFUERA de React (es el atributo "data-theme" del <html>, que el script
// de inicio de app/layout.tsx ya fijó antes de que React hidrate) — es
// exactamente el caso para el que existe este hook (suscribirse a un
// valor externo de forma seguro para SSR), en vez del patrón más común
// pero menos correcto de "leerlo en un efecto y guardarlo en un
// useState" (dispara un render de más y el linter de hooks lo marca).
// ============================================================================

import { useSyncExternalStore } from 'react';
import { SunIcon, MoonIcon } from '@/components/ui/icons';

type Theme = 'light' | 'dark';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

// Durante el render en el SERVIDOR no existe "document" — cualquier valor
// fijo alcanza (nunca se ve: el script de inicio ya aplicó el tema real
// al <html> antes de la primera pintura del navegador, y este componente
// se hidrata leyendo ESE valor, no este).
function getServerSnapshot(): Theme {
  return 'light';
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center
                 rounded-full border border-border bg-surface text-foreground shadow-md
                 transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.08]"
    >
      {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
}
