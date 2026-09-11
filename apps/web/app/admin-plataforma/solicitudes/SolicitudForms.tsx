'use client';

// ============================================================================
// SolicitudForms.tsx — Client Components A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error de cada accion
// sin que estas llamen a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { fieldClasses } from '@/components/ui/field-styles';
import { aprobarSolicitud, rechazarSolicitud } from './actions';

export function AprobarSolicitudForm({ requestId, label }: { requestId: string; label: string }) {
  const [state, formAction, pending] = useActionState(
    aprobarSolicitud.bind(null, requestId),
    INITIAL_ACTION_STATE,
  );

  return (
    <div>
      <form action={formAction}>
        <Button type="submit" size="sm" disabled={pending}>
          {label}
        </Button>
      </form>
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </div>
  );
}

export function RechazarSolicitudForm({
  requestId,
  reasonPlaceholder,
  confirmMessage,
  label,
}: {
  requestId: string;
  reasonPlaceholder: string;
  confirmMessage: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(
    rechazarSolicitud.bind(null, requestId),
    INITIAL_ACTION_STATE,
  );

  return (
    <div>
      <form
        action={formAction}
        className="flex items-center gap-2"
        onSubmit={(e) => {
          if (!window.confirm(confirmMessage)) {
            e.preventDefault();
          }
        }}
      >
        <input
          name="reason"
          type="text"
          placeholder={reasonPlaceholder}
          className={`${fieldClasses} py-1.5 text-sm`}
        />
        <button type="submit" disabled={pending} className="text-sm font-medium text-danger hover:underline">
          {label}
        </button>
      </form>
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </div>
  );
}
