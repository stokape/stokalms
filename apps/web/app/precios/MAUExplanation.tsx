// ============================================================================
// MAUExplanation.tsx — Explica el modelo de licenciamiento (usuarios
// activos mensuales) con un diagrama de embudo de 3 pasos + un tooltip
// sobre la definición exacta de "usuario activo". Server Component: el
// tooltip es CSS puro (":focus-within"/hover sobre un <button> enfocable),
// mismo criterio que el resto de la app para evitar JS donde alcanza con
// CSS (ver ThemeToggle.tsx, el acordeón de usuarios/page.tsx).
//
// Recibe TEXTO YA RESUELTO (strings planos, no el diccionario con sus
// funciones "step1(n)") — ver la nota extensa en PricingSection.tsx sobre
// por qué.
// ============================================================================

export function MAUExplanation({
  heading,
  body,
  step1,
  step2,
  step3,
  tooltipLabel,
  tooltipBody,
}: {
  heading: string;
  body: string;
  step1: string;
  step2: string;
  step3: string;
  tooltipLabel: string;
  tooltipBody: string;
}) {
  return (
    <section className="border-t border-border bg-surface/50">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{heading}</h2>
          <p className="mt-4 text-sm text-muted sm:text-base">{body}</p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <FunnelStep>{step1}</FunnelStep>
          <Arrow />
          <FunnelStep>{step2}</FunnelStep>
          <Arrow />
          <FunnelStep emphasized>
            {step3}
            <MAUTooltip label={tooltipLabel} body={tooltipBody} />
          </FunnelStep>
        </div>
      </div>
    </section>
  );
}

function FunnelStep({ children, emphasized }: { children: React.ReactNode; emphasized?: boolean }) {
  return (
    <div
      className={
        'inline-flex items-center gap-1.5 rounded-xl border px-5 py-3 text-sm font-medium ' +
        (emphasized ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface text-foreground')
      }
    >
      {children}
    </div>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-muted" aria-hidden>
      <path d="M12 4v14M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Tooltip CSS-only: el "group" es el <span> contenedor, el panel aparece
// con "group-hover"/"group-focus-within" — el <button> adentro es
// enfocable con teclado (Tab) y trae su propio "title" como respaldo para
// lectores que no procesen el panel flotante.
function MAUTooltip({ label, body }: { label: string; body: string }) {
  return (
    <span className="group relative ml-1 inline-flex">
      <button
        type="button"
        aria-label={`${label}: ${body}`}
        title={body}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px] font-semibold leading-none outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-surface p-3 text-left text-xs font-normal normal-case text-muted opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {body}
      </span>
    </span>
  );
}
