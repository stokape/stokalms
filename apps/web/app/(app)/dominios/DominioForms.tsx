'use client';

// ============================================================================
// DominioForms.tsx — Client Components A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error/éxito de cada
// accion sin que estas llamen a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuccessBanner } from '@/components/SuccessBanner';
import { Button } from '@/components/ui/Button';
import { fieldClasses } from '@/components/ui/field-styles';
import { agregarDominio, verificarDominio, eliminarDominio, type DominioActionState } from './actions';

const INITIAL_STATE: DominioActionState = { error: null };

export function VerificarDominioButton({ domainId, label }: { domainId: string; label: string }) {
  const [state, formAction, pending] = useActionState(verificarDominio.bind(null, domainId), INITIAL_STATE);

  return (
    <div>
      <form action={formAction}>
        <button type="submit" disabled={pending} className="text-xs font-medium text-primary hover:underline">
          {label}
        </button>
      </form>
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </div>
  );
}

export function EliminarDominioButton({
  domainId,
  confirmMessage,
  label,
}: {
  domainId: string;
  confirmMessage: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(eliminarDominio.bind(null, domainId), INITIAL_STATE);

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!window.confirm(confirmMessage)) {
            e.preventDefault();
          }
        }}
      >
        <button type="submit" disabled={pending} className="text-xs font-medium text-danger hover:underline">
          {label}
        </button>
      </form>
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </div>
  );
}

export function AgregarDominioForm({
  patternHint,
  placeholder,
  submitLabel,
  submittingLabel,
  doneLabel,
}: {
  patternHint: string;
  placeholder: string;
  submitLabel: string;
  submittingLabel: string;
  doneLabel: string;
}) {
  const [state, formAction, pending] = useActionState(agregarDominio, INITIAL_STATE);

  return (
    <div>
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      {state.saved && (
        <div className="mb-3">
          <SuccessBanner>{doneLabel}</SuccessBanner>
        </div>
      )}
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input
          name="domain"
          type="text"
          required
          pattern="^([A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$"
          title={patternHint}
          placeholder={placeholder}
          className={`max-w-xs ${fieldClasses}`}
        />
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </div>
  );
}
