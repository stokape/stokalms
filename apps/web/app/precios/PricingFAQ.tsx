'use client';

// ============================================================================
// PricingFAQ.tsx — Acordeón de preguntas frecuentes, con <details>/<summary>
// nativo (mismo patrón que usuarios/page.tsx: cero JS para abrir/cerrar,
// el navegador ya lo resuelve solo). El ÚNICO motivo por el que este
// archivo es un Client Component (a diferencia de PlanComparison.tsx o
// MAUExplanation.tsx) es poder escuchar "onToggle" para registrar
// "pricing_faq_opened" la primera vez que se abre cada pregunta — ver
// app/precios/actions.ts.
// ============================================================================

import { useRef } from 'react';
import { registrarAperturaFaq } from './actions';
import type { PreciosDictionary } from '../dictionaries/precios';

export function PricingFAQ({ text }: { text: PreciosDictionary['faq'] }) {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <h2 className="text-center font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {text.heading}
        </h2>

        <div className="mt-10 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {text.items.map((item) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  // Solo se registra la PRIMERA apertura de cada pregunta (no cada vez que
  // se abre/cierra un acordeón ya visto) — evita inflar la métrica con
  // alguien jugando con el mismo acordeón.
  const tracked = useRef(false);

  function handleToggle(e: React.SyntheticEvent<HTMLDetailsElement>) {
    if (e.currentTarget.open && !tracked.current) {
      tracked.current = true;
      void registrarAperturaFaq(question);
    }
  }

  return (
    <details className="group" onToggle={handleToggle}>
      <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium outline-none [list-style:none] hover:bg-black/[.02] focus-visible:bg-black/[.02] dark:hover:bg-white/[.04] dark:focus-visible:bg-white/[.04] [&::-webkit-details-marker]:hidden">
        {question}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="border-t border-border bg-black/[.015] px-5 py-4 text-sm text-muted dark:bg-white/[.02]">
        {answer}
      </div>
    </details>
  );
}
