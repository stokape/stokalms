'use client';

// ============================================================================
// (app)/error.tsx — Convención de Next.js: si CUALQUIER Server Component de
// una pantalla de negocio lanza una excepción sin atrapar (no un
// ErrorBanner controlado, algo genuinamente inesperado), Next.js muestra
// esto en vez de la pantalla en blanco/con stack trace por defecto. Tiene
// que ser Client Component ("use client") — es requisito de Next.js para
// este archivo en particular (necesita "reset()", una funcion de React que
// solo existe del lado del cliente).
//
// Texto en español fijo (sin pasar por getLocale/diccionario, a diferencia
// del resto de la app): getLocale() lee cookies del lado del SERVIDOR — un
// Client Component no puede llamarla directo. Mismo criterio ya usado en
// InstitutionHome.tsx/verify/[code]/page.tsx para pantallas de borde
// similares.
// ============================================================================

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { LinkButton } from '@/components/ui/LinkButton';
import { StokaMark } from '@/components/StokaLogo';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Unico lugar util para ver el error real mientras no hay reporte a un servicio externo (Sentry, etc.).
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <StokaMark className="h-12 w-12 opacity-70" />
      <h1 className="text-xl font-semibold">Algo salió mal</h1>
      <p className="max-w-sm text-sm text-muted">
        No pudimos mostrar esta pantalla. Puede ser algo pasajero — probá de nuevo.
      </p>
      <div className="mt-2 flex gap-3">
        <Button onClick={reset} type="button">
          Reintentar
        </Button>
        <LinkButton href="/cursos" variant="secondary">
          Ir a Cursos
        </LinkButton>
      </div>
      {error.digest && <p className="mt-4 text-xs text-muted">Código: {error.digest}</p>}
    </div>
  );
}
