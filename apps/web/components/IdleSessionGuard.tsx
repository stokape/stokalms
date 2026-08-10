'use client';

// ============================================================================
// IdleSessionGuard.tsx — Después de IDLE_LIMIT_MS sin NINGUNA interacción de
// mouse/teclado/touch, bloquea la pantalla con un aviso de "sesión caducada
// por inactividad" y ofrece dos salidas (ver ../app/(app)/session-actions.ts):
// reingresar con la contraseña (usuario ya precompletado) o cerrar sesión
// del todo. Pensado para computadoras COMPARTIDAS (ej. una sala de
// profesores) — es una capa de higiene de sesión sobre la UX, no reemplaza
// el control de seguridad real (la expiración del access_token de Keycloak,
// ver auth.ts).
//
// Por qué vive en el layout y no en cada página: un layout de Next.js NO se
// vuelve a montar al navegar entre páginas hijas del mismo grupo — así el
// cronómetro de inactividad persiste de forma continua mientras la persona
// va de una pantalla a otra, en vez de reiniciarse solo (Y OCULTAR
// inactividad real) cada vez que carga una página nueva.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/locale';

const IDLE_LIMIT_MS = 3 * 60 * 1000;

// "scroll"/"wheel" con "passive: true" (ver el listener mas abajo) para no
// bloquear el scroll normal de la pagina mientras se escucha actividad.
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'] as const;

// Client Component: no puede leer la cookie de idioma directamente (ver
// lib/locale.ts, que usa next/headers, solo server) — el layout que lo
// monta ((app)/layout.tsx) ya la leyó para su propio uso y la pasa acá
// como prop, mismo patrón que "userLabel"/"onReingresar".
const TEXT: Record<Locale, { title: string; body: (label: string, minutes: number) => string; reenter: string; logout: string }> = {
  es: {
    title: 'Tu sesión caducó por inactividad',
    body: (label, minutes) => `${label}: pasaron ${minutes} minutos sin actividad. Para seguir, ingresa tu contraseña o cierra sesión.`,
    reenter: 'Ingresar con mi contraseña',
    logout: 'Cerrar sesión',
  },
  en: {
    title: 'Your session expired from inactivity',
    body: (label, minutes) => `${label}: it's been ${minutes} minutes without activity. To continue, enter your password or log out.`,
    reenter: 'Log in with my password',
    logout: 'Log out',
  },
};

export function IdleSessionGuard({
  userLabel,
  onReingresar,
  onCerrarSesion,
  locale,
}: {
  userLabel: string;
  onReingresar: (formData: FormData) => Promise<void>;
  onCerrarSesion: (formData: FormData) => Promise<void>;
  locale: Locale;
}) {
  const t = TEXT[locale];
  const [locked, setLocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setLocked(true), IDLE_LIMIT_MS);
    }

    resetTimer();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);

  if (!locked) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center shadow-xl">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warning-bg text-warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="mb-2 text-lg font-semibold">{t.title}</h2>
        <p className="mb-6 text-sm text-muted">{t.body(userLabel, IDLE_LIMIT_MS / 60000)}</p>
        <div className="flex flex-col gap-2">
          <form action={onReingresar}>
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              {t.reenter}
            </button>
          </form>
          <form action={onCerrarSesion}>
            <button
              type="submit"
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-black/[.03] dark:hover:bg-white/[.06]"
            >
              {t.logout}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
