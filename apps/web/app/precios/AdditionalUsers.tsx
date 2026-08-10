// ============================================================================
// AdditionalUsers.tsx — Tarifas de referencia por usuario activo adicional,
// una por plan (ver PricingPlan.additionalUserPrice, lib/pricing.ts —
// nunca un numero suelto ademas del que ya vive ahi). El día que un panel
// de facturación real conozca el uso mensual de un tenant, puede renderizar
// <UpgradeRecommendation> debajo de esta sección con ese dato — ver la nota
// extensa en ese archivo sobre por qué no se hace todavía acá.
// ============================================================================

import { formatPENDecimal, type PricingPlan } from '@/lib/pricing';

export function AdditionalUsers({
  plans,
  text,
}: {
  plans: PricingPlan[];
  text: { heading: string; body: string; perUserSuffix: string; custom: string };
}) {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{text.heading}</h2>
          <p className="mt-4 text-sm text-muted sm:text-base">{text.body}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div key={plan.planId} className="rounded-xl border border-border bg-surface p-5 text-center">
              <p className="text-sm font-semibold">{plan.name}</p>
              <p className="mt-2 font-display text-xl font-semibold tracking-tight">
                {plan.additionalUserPrice !== null ? formatPENDecimal(plan.additionalUserPrice) : text.custom}
              </p>
              {plan.additionalUserPrice !== null && (
                <p className="mt-1 text-xs text-muted">{text.perUserSuffix}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
