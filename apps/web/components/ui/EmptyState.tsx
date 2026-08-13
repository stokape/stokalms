// ============================================================================
// EmptyState.tsx — Reemplaza el clásico "todavía no hay nada" en texto
// gris suelto por un bloque con ícono, mensaje y (cuando existe algo que la
// persona pueda hacer al respecto) una acción conectada ahí mismo — nunca
// un callejón sin salida. Ver el uso en cursos/page.tsx, usuarios/page.tsx,
// cohortes/page.tsx y mis-matriculas/page.tsx.
//
// "action" es opcional a propósito: en mis-matriculas/page.tsx, por
// ejemplo, un Estudiante no tiene ninguna acción real disponible (matricu-
// larse lo hace el coordinador), así que ese caso solo mejora el mensaje,
// sin inventar un botón que no lleva a nada.
// ============================================================================

import type { ComponentType, ReactNode, SVGProps } from 'react';

interface EmptyStateProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: IconComponent, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <IconComponent className="h-6 w-6" />
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
