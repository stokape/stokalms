'use server';

// ============================================================================
// app/precios/actions.ts — Que pasa al hacer clic en el CTA de un plan o al
// cambiar Mensual/Anual. Server Actions (no Route Handlers) a proposito:
// es el mismo mecanismo que usa el resto de la app para registrar eventos
// SIEMPRE desde el servidor (ver lib/analytics.ts) — nunca hay un script
// de analitica corriendo en el navegador de quien visita.
//
// PREPARADO PARA CHECKOUT (ver la nota grande en lib/pricing.ts,
// "PlanCtaAction"): hoy el UNICO flujo real de alta que existe en Stoka
// LMS es el formulario de /registro-institucion (crea una SOLICITUD que
// revisa un humano, ver tenant-registration.service.ts) — no hay todavia
// ningun sistema de suscripciones/checkout de pago. Los tres planes de
// pago (Starter/Business/Pro) y Enterprise apuntan los tres a ESE mismo
// formulario, que es honestamente el paso mas parecido a "crear tu
// organizacion" que existe hoy — con el plan elegido pasado en la URL
// para que la persona no tenga que repetirlo. El dia que exista un
// checkout de pago real, "resolvePlanCtaHref" es el UNICO lugar que hay
// que tocar (agregar un caso 'checkout' a PlanCtaAction) — ningun
// componente visual necesita cambiar.
// ============================================================================

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { trackEvent } from '@/lib/analytics';
import { getPricingPlan, type BillingPeriod, type PlanId } from '@/lib/pricing';

function resolvePlanCtaHref(planId: PlanId): string {
  // Los dos casos de PlanCtaAction ('register' | 'contactSales') resuelven
  // HOY al mismo lugar (ver la nota de arriba) — separados igual en el
  // switch para que agregar un tercer caso ('checkout') el dia de mañana
  // sea un cambio de una linea, no una reescritura.
  const plan = getPricingPlan(planId);
  switch (plan?.ctaAction) {
    case 'contactSales':
    case 'register':
    default:
      return `/registro-institucion?plan=${planId}`;
  }
}

export async function registrarSeleccionPlan(
  planId: PlanId,
  billingPeriod: BillingPeriod,
): Promise<void> {
  const host = (await headers()).get('host') ?? undefined;

  // El plan Enterprise no es una "seleccion de compra" (no tiene precio
  // fijo) sino un pedido de contacto comercial — se distingue con su
  // propio evento ademas de "plan_selected", para poder medir el embudo
  // de ventas empresarial aparte del de autoservicio.
  if (planId === 'enterprise') {
    void trackEvent('enterprise_contact_clicked', { host });
  } else {
    void trackEvent('plan_selected', { host, metadata: { planId, billingPeriod } });
  }

  redirect(resolvePlanCtaHref(planId));
}

// Llamado directamente (sin <form>) desde BillingToggle.tsx (Client
// Component) al cambiar Mensual/Anual — los Server Actions se pueden
// invocar tambien de forma imperativa, no solo como "action" de un
// <form> (ver Next.js App Router). "void" a proposito: es una metrica,
// nunca debe bloquear ni fallar visiblemente la interaccion de quien esta
// eligiendo su plan.
export async function registrarCambioFacturacion(period: BillingPeriod): Promise<void> {
  const host = (await headers()).get('host') ?? undefined;
  void trackEvent('billing_period_changed', { host, metadata: { period } });
}

// Llamado desde PricingFAQ.tsx (Client Component) la primera vez que se
// abre cada pregunta — mismo mecanismo que registrarCambioFacturacion de
// arriba (invocacion directa de un Server Action, sin <form>).
export async function registrarAperturaFaq(question: string): Promise<void> {
  const host = (await headers()).get('host') ?? undefined;
  void trackEvent('pricing_faq_opened', { host, metadata: { question } });
}
