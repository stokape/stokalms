// ============================================================================
// PricingSection.tsx — Compone toda la sección de precios en el orden que
// pide el brief comercial: encabezado → planes (mensual/anual) → explicación
// de MAU → usuarios adicionales → comparador → CTA Enterprise → FAQ. Server
// Component: solo PricingPlans (mensual/anual) y PricingFAQ (analítica de
// apertura) bajan a Client Component, cada uno por su cuenta — ver la nota
// en PricingPlans.tsx.
//
// Vive DENTRO de PlatformLanding.tsx (la home, con id="precios" — ver ahi):
// el titulo de aca abajo es un <h2>, no <h1> — la home ya tiene su propio
// <h1> en el Hero, y una pagina nunca deberia tener dos.
//
// OJO CON LO QUE CRUZA HACIA LOS CLIENT COMPONENTS: "PreciosDictionary"
// tiene algunos campos con FUNCIONES (ej. "plan.activeUsersUpTo",
// "mau.step1/2/3" — ver dictionaries/precios.ts), porque son plantillas
// parametrizadas por un número. React Server Components NO puede
// serializar una funcion como prop hacia un Client Component (ver
// PricingPlans.tsx, PricingFAQ.tsx) — asi que ESTE archivo (Server
// Component, con acceso directo y sin restricciones al diccionario
// completo) es el UNICO lugar que llama a esas funciones, y a cada
// componente hijo solo le pasa el STRING ya resuelto o el subobjeto del
// diccionario que efectivamente no tiene funciones adentro. Se detecto
// este limite probando la pagina de verdad (Next.js lo rechaza en
// tiempo de ejecucion, "tsc"/"next build" no lo detectan).
// ============================================================================

import { PricingPlans } from './PricingPlans';
import { MAUExplanation } from './MAUExplanation';
import { AdditionalUsers } from './AdditionalUsers';
import { PlanComparison } from './PlanComparison';
import { EnterpriseCTA } from './EnterpriseCTA';
import { PricingFAQ } from './PricingFAQ';
import type { PricingPlan } from '@/lib/pricing';
import type { PreciosDictionary } from '../dictionaries/precios';

// Numeros de EJEMPLO del embudo de MAU (ver MAUExplanation.tsx) — viven
// aca (no dentro de ese componente) porque resolver "step1(n)" es
// justamente lo que este archivo tiene que hacer ANTES de que el texto
// cruce hacia cualquier componente.
const MAU_EXAMPLE_REGISTERED = 500;
const MAU_EXAMPLE_ACTIVE = 42;

export function PricingSection({ plans, t }: { plans: PricingPlan[]; t: PreciosDictionary }) {
  // "activeUsersUpTo" es una FUNCION — se resuelve ACA, una vez por plan,
  // y el resultado (un string) es lo unico que viaja despues. "planText"
  // es el resto de t.plan SIN esa funcion (destructuring la excluye de
  // verdad del objeto, no solo del tipo).
  const { activeUsersUpTo, ...planText } = t.plan;
  const plansWithLabels = plans.map((plan) => ({
    ...plan,
    activeUsersLabel: plan.activeUsers !== null ? activeUsersUpTo(plan.activeUsers) : t.plan.customUsers,
  }));

  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {t.hero.badge}
          </span>
          <h2 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
            {t.hero.title}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted sm:text-lg">{t.hero.subtitle}</p>
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-16 sm:pb-20">
          <PricingPlans
            plans={plansWithLabels}
            billingToggleText={t.billingToggle}
            planText={planText}
            featuresText={t.features}
          />
        </div>
      </section>

      <MAUExplanation
        heading={t.mau.heading}
        body={t.mau.body}
        step1={t.mau.step1(MAU_EXAMPLE_REGISTERED)}
        step2={t.mau.step2(MAU_EXAMPLE_ACTIVE)}
        step3={t.mau.step3(MAU_EXAMPLE_ACTIVE)}
        tooltipLabel={t.mau.tooltipLabel}
        tooltipBody={t.mau.tooltipBody}
      />
      <AdditionalUsers plans={plans} text={t.additionalUsers} />
      <PlanComparison text={t.comparison} />
      <EnterpriseCTA text={t.enterpriseCta} />
      <PricingFAQ text={t.faq} />
    </>
  );
}
