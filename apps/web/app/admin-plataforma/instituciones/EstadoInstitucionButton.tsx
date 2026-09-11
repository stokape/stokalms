'use client';

// ============================================================================
// EstadoInstitucionButton.tsx — Client Component A PROPOSITO (ver
// periodos/PeriodosForms.tsx): useActionState necesita el cliente para
// mostrar el error de cambiarEstadoInstitucion sin que esta llame a
// redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { cambiarEstadoInstitucion } from './actions';

export function EstadoInstitucionButton({
  tenantId,
  active,
  deactivateLabel,
  activateLabel,
}: {
  tenantId: string;
  active: boolean;
  deactivateLabel: string;
  activateLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    cambiarEstadoInstitucion.bind(null, tenantId, !active),
    INITIAL_ACTION_STATE,
  );

  return (
    <div>
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending}
          className={`text-xs font-medium hover:underline ${active ? 'text-danger' : 'text-success'}`}
        >
          {active ? deactivateLabel : activateLabel}
        </button>
      </form>
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </div>
  );
}
