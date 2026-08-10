// ============================================================================
// PageHeader.tsx — Encabezado estándar de cada pantalla: título, una
// descripción opcional (breadcrumb/subtítulo) y un slot a la derecha para
// la acción principal ("Crear curso", "Crear periodo"...). Antes cada
// pantalla ponía el botón de "crear" mezclado en cualquier parte del
// cuerpo — juntarlo siempre en el mismo lugar (arriba a la derecha del
// título) es lo que hace que la interfaz se sienta consistente entre una
// pantalla y otra.
// ============================================================================

import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
