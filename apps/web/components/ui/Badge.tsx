// ============================================================================
// Badge.tsx — Una "pastilla" de color para estados (Activo/Retirado,
// Vigente/Revocado, Presente/Ausente...). Antes cada pantalla coloreaba el
// TEXTO suelto ("text-green-700", "text-red-600") sin ningún fondo ni
// forma — funcional, pero fácil de pasar por alto en una tabla larga. Una
// pastilla con fondo se nota de un vistazo, que es justo lo que se pidió
// ("resaltar opciones").
// ============================================================================

import type { ReactNode } from 'react';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const tones: Record<BadgeTone, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
  neutral: 'bg-black/[.05] text-muted dark:bg-white/[.08]',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
