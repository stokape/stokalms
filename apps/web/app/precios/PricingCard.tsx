// ============================================================================
// PricingCard.tsx — Una tarjeta de plan (Starter/Business/Pro/Enterprise).
// Presentacional puro: no sabe de donde salen los datos (los recibe ya
// resueltos por PricingPlans.tsx/PricingSection.tsx) ni que hace el CTA al
// hacer clic (recibe el <form action={...}> ya armado como "ctaAction", un
// Server Action enlazado con el planId/periodo — ver app/precios/actions.ts).
//
// "planText" es "PreciosDictionary['plan']" SIN "activeUsersUpTo" (una
// funcion) — PricingSection.tsx ya la resolvio en "plan.activeUsersLabel"
// antes de que esto llegara aca. Ver la nota extensa en PricingSection.tsx
// sobre por que ningun Client Component de esta pagina puede recibir una
// funcion como prop.
// ============================================================================

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlanFeature } from './PlanFeature';
import {
  formatPEN,
  getAnnualSaving,
  getPriceForPeriod,
  type BillingPeriod,
  type PricingPlan,
} from '@/lib/pricing';
import type { PreciosDictionary } from '../dictionaries/precios';

type PlanText = Omit<PreciosDictionary['plan'], 'activeUsersUpTo'>;

export function PricingCard({
  plan,
  period,
  planText,
  featuresText,
  ctaAction,
}: {
  plan: PricingPlan & { activeUsersLabel: string };
  period: BillingPeriod;
  planText: PlanText;
  featuresText: PreciosDictionary['features'];
  /** <form action={...}> ya con planId/periodo enlazados (ver
   * app/precios/actions.ts, registrarSeleccionPlan). */
  ctaAction: (formData: FormData) => void;
}) {
  const price = getPriceForPeriod(plan, period);
  const saving = period === 'annual' ? getAnnualSaving(plan) : null;
  const ctaLabel = planText.cta[plan.planId];

  return (
    <Card
      className={
        'relative flex flex-col gap-6 ' +
        (plan.recommended ? 'border-2 border-primary shadow-lg lg:-translate-y-2' : '')
      }
    >
      {plan.recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
          {planText.recommendedBadge}
        </span>
      )}

      <div>
        <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>

        <div className="mt-3">
          {price !== null ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-semibold tracking-tight">
                  {formatPEN(price)}
                </span>
                <span className="text-sm text-muted">
                  {period === 'annual' ? planText.annualSuffix : planText.monthlySuffix}
                </span>
              </div>
              {period === 'annual' && saving !== null && saving > 0 && (
                <p className="mt-1.5 text-sm font-medium text-success">
                  {planText.savingsPrefix} {formatPEN(saving)} {planText.savingsSuffix}
                </p>
              )}
            </>
          ) : (
            <>
              <span className="font-display text-3xl font-semibold tracking-tight">
                {planText.customPrice}
              </span>
              <p className="mt-1.5 text-sm text-muted">{planText.customPriceNote}</p>
            </>
          )}
        </div>

        <p className="mt-3 text-sm font-medium text-muted">{plan.activeUsersLabel}</p>
      </div>

      <form action={ctaAction}>
        <Button type="submit" variant={plan.recommended ? 'primary' : 'secondary'} className="w-full" size="lg">
          {ctaLabel}
        </Button>
      </form>

      <ul className="flex flex-1 flex-col gap-3">
        {plan.features.map((key) => (
          <PlanFeature key={key}>{featuresText[key]}</PlanFeature>
        ))}
      </ul>
    </Card>
  );
}
