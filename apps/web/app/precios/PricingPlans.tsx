'use client';

// ============================================================================
// PricingPlans.tsx — Dueño del estado "Mensual | Anual" (ver BillingToggle.tsx)
// y quien arma, para cada plan, el <form action={...}> que dispara
// registrarSeleccionPlan con el planId y el período YA elegidos (ver
// app/precios/actions.ts). Es el ÚNICO motivo por el que esta parte de la
// página necesita ser un Client Component: el resto de app/precios/
// (MAU, usuarios adicionales, comparador, FAQ) no depende de ningún
// estado del navegador y se queda como Server Component — mismo criterio
// que BrandingStudio.tsx (el único Client Component de configuracion-marca).
//
// Recibe "planText"/"featuresText"/"billingToggleText" ya sin funciones
// (ver la nota extensa en PricingSection.tsx) — jamas el diccionario
// completo.
// ============================================================================

import { useState } from 'react';
import { BillingToggle } from './BillingToggle';
import { PricingCard } from './PricingCard';
import { registrarSeleccionPlan, registrarCambioFacturacion } from './actions';
import type { BillingPeriod, PricingPlan } from '@/lib/pricing';
import type { PreciosDictionary } from '../dictionaries/precios';

type PlanText = Omit<PreciosDictionary['plan'], 'activeUsersUpTo'>;

export function PricingPlans({
  plans,
  billingToggleText,
  planText,
  featuresText,
}: {
  plans: Array<PricingPlan & { activeUsersLabel: string }>;
  billingToggleText: PreciosDictionary['billingToggle'];
  planText: PlanText;
  featuresText: PreciosDictionary['features'];
}) {
  const [period, setPeriod] = useState<BillingPeriod>('monthly');

  function handlePeriodChange(next: BillingPeriod) {
    setPeriod(next);
    void registrarCambioFacturacion(next);
  }

  return (
    <div>
      <div className="mb-10 flex justify-center">
        <BillingToggle period={period} onChange={handlePeriodChange} text={billingToggleText} />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <PricingCard
            key={plan.planId}
            plan={plan}
            period={period}
            planText={planText}
            featuresText={featuresText}
            ctaAction={registrarSeleccionPlan.bind(null, plan.planId, period)}
          />
        ))}
      </div>
    </div>
  );
}
