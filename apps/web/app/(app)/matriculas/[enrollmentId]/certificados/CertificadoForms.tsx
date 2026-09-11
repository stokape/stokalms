'use client';

// ============================================================================
// CertificadoForms.tsx — Client Components A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error de cada accion
// sin que estas llamen a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { emitirCertificado, revocarCertificado } from './actions';

export function RevocarCertificadoButton({
  enrollmentId,
  certificateId,
  confirmMessage,
  label,
}: {
  enrollmentId: string;
  certificateId: string;
  confirmMessage: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(
    revocarCertificado.bind(null, enrollmentId, certificateId),
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="flex flex-col items-end gap-1">
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!window.confirm(confirmMessage)) {
            e.preventDefault();
          }
        }}
      >
        <button type="submit" disabled={pending} className="text-xs text-red-600 underline dark:text-red-400">
          {label}
        </button>
      </form>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </div>
  );
}

export function EmitirCertificadoForm({
  enrollmentId,
  label,
  submittingLabel,
}: {
  enrollmentId: string;
  label: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    emitirCertificado.bind(null, enrollmentId),
    INITIAL_ACTION_STATE,
  );

  return (
    <>
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction}>
        <Button type="submit" disabled={pending}>
          {pending ? submittingLabel : label}
        </Button>
      </form>
    </>
  );
}
