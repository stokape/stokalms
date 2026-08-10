// ============================================================================
// BillingToggle.tsx — Selector "Mensual | Anual" que controla el precio
// mostrado en TODAS las PricingCard a la vez (ver PricingPlans.tsx, dueño
// del estado). Componente puramente presentacional (no tiene su propio
// useState): recibe el período actual y avisa el cambio hacia arriba, para
// que un solo lugar (PricingPlans) sea la fuente de verdad de qué período
// está eligiendo la persona.
// ============================================================================

'use client';

import type { BillingPeriod } from '@/lib/pricing';
import type { PreciosDictionary } from '../dictionaries/precios';

export function BillingToggle({
  period,
  onChange,
  text,
}: {
  period: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
  text: PreciosDictionary['billingToggle'];
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        role="radiogroup"
        aria-label={`${text.monthly} / ${text.annual}`}
        className="inline-flex rounded-full border border-border bg-surface p-1"
      >
        <button
          type="button"
          role="radio"
          aria-checked={period === 'monthly'}
          onClick={() => onChange('monthly')}
          className={
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors ' +
            (period === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-foreground')
          }
        >
          {text.monthly}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={period === 'annual'}
          onClick={() => onChange('annual')}
          className={
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors ' +
            (period === 'annual' ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-foreground')
          }
        >
          {text.annual}
        </button>
      </div>
      {period === 'annual' && (
        <span className="inline-flex items-center rounded-full bg-success-bg px-3 py-1 text-xs font-medium text-success">
          {text.annualBadge}
        </span>
      )}
    </div>
  );
}
