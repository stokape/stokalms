// ============================================================================
// PlanFeature.tsx — Una fila "✓ + texto" dentro de una PricingCard. Extraído
// aparte porque PlanComparison.tsx necesita el mismo check en un contexto
// distinto (celda de tabla) — un solo lugar define cómo se ve "incluido".
// ============================================================================

import { CheckIcon } from '@/components/ui/icons';

export function PlanFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span className="text-foreground">{children}</span>
    </li>
  );
}
