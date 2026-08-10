// ============================================================================
// PlanComparison.tsx — Tabla "Compara todos los planes". <table> semántica
// real (no una grilla de <div>) a propósito: es contenido tabular genuino,
// mejor para SEO/accesibilidad que recrearla con CSS Grid (lectores de
// pantalla la anuncian como tabla, con encabezados de fila/columna).
//
// RESPONSIVE: la tabla completa vive dentro de un contenedor con
// "overflow-x-auto" (se puede desplazar horizontalmente en mobile en vez
// de romper el layout achicando el texto hasta ser ilegible) y la primera
// columna (el nombre de cada característica) queda "sticky" a la
// izquierda, así nunca se pierde de vista con qué fila se está comparando
// mientras se desliza para ver Business/Pro/Enterprise.
// ============================================================================

import { CheckIcon, MinusIcon } from '@/components/ui/icons';
import { COMPARISON_ROWS, PRICING_PLANS, type ComparisonValue } from '@/lib/pricing';
import type { PreciosDictionary } from '../dictionaries/precios';

type ComparisonText = PreciosDictionary['comparison'];

function renderValue(value: ComparisonValue, values: ComparisonText['values']) {
  if (typeof value === 'boolean') {
    return value ? (
      <CheckIcon className="mx-auto h-4 w-4 text-primary" aria-hidden />
    ) : (
      <MinusIcon className="mx-auto h-4 w-4 text-muted/50" aria-hidden />
    );
  }
  // Valores de texto "conocidos" (ver ComparisonRow en lib/pricing.ts) se
  // traducen; cualquier otro string (ej. un limite numerico como "50") se
  // muestra tal cual.
  const known = values as Record<string, string>;
  return known[value] ?? value;
}

export function PlanComparison({ text }: { text: ComparisonText }) {
  const rowLabels = text.rows as Record<string, string>;

  return (
    <section className="border-t border-border bg-surface/50">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <h2 className="text-center font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {text.heading}
        </h2>

        <div className="mt-10 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th
                  scope="col"
                  className="sticky left-0 z-10 bg-surface px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted"
                >
                  {text.planColumn}
                </th>
                {PRICING_PLANS.map((plan) => (
                  <th
                    key={plan.planId}
                    scope="col"
                    className={
                      'px-4 py-3 text-center text-sm font-semibold ' +
                      (plan.recommended ? 'bg-primary/5 text-primary' : 'text-foreground')
                    }
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={row.key} className={i % 2 === 1 ? 'bg-black/[.015] dark:bg-white/[.02]' : ''}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-t border-border bg-inherit px-4 py-3 text-left font-medium text-foreground"
                  >
                    {rowLabels[row.key]}
                  </th>
                  {PRICING_PLANS.map((plan) => (
                    <td
                      key={plan.planId}
                      className={
                        'border-t border-border px-4 py-3 text-center ' +
                        (plan.recommended ? 'bg-primary/5' : '')
                      }
                    >
                      {renderValue(row.values[plan.planId], text.values)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
