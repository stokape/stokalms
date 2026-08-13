'use client';

// ============================================================================
// admin-plataforma/error.tsx — Mismo mecanismo y mismo motivo que
// (app)/error.tsx, para las pantallas de administración de plataforma.
// ============================================================================

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { LinkButton } from '@/components/ui/LinkButton';
import { StokaMark } from '@/components/StokaLogo';

export default function AdminPlataformaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Unico lugar util para ver el error real mientras no hay reporte a un servicio externo.
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
        <LinkButton href="/admin-plataforma/solicitudes" variant="secondary">
          Ir al panel
        </LinkButton>
      </div>
      {error.digest && <p className="mt-4 text-xs text-muted">Código: {error.digest}</p>}
    </div>
  );
}
