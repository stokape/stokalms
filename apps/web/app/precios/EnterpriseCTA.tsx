'use client';

// ============================================================================
// EnterpriseCTA.tsx — Banda de refuerzo para el plan Enterprise, después
// del comparador (mismo lugar/estilo que CtaBand en PlatformLanding.tsx).
// Enterprise YA aparece como una PricingCard más arriba — esta banda
// existe para quien se saltea las tarjetas y llega directo al comparador,
// y quiere hablar con ventas sin volver a subir.
//
// Client Component A PROPOSITO (ver periodos/PeriodosForms.tsx):
// registrarSeleccionPlan ya NO llama a redirect() (ver la nota extensa en
// actions.ts), useActionState + useActionRedirect necesitan el cliente.
// ============================================================================

import { useActionState } from 'react';
import { registrarSeleccionPlan } from './actions';
import { useActionRedirect } from '@/components/ui/useActionRedirect';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';

export function EnterpriseCTA({ text }: { text: { heading: string; body: string; cta: string } }) {
  const [state, formAction] = useActionState(
    registrarSeleccionPlan.bind(null, 'enterprise', 'monthly'),
    INITIAL_ACTION_STATE,
  );
  useActionRedirect(state);

  return (
    <section className="border-t border-border bg-primary/5">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-14 text-center">
        <h2 className="font-display text-2xl font-semibold tracking-tight">{text.heading}</h2>
        <p className="max-w-xl text-sm text-muted">{text.body}</p>
        <form action={formAction}>
          <Button type="submit" variant="primary" size="lg">
            {text.cta}
          </Button>
        </form>
      </div>
    </section>
  );
}
