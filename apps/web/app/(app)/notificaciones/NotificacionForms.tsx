'use client';

// ============================================================================
// NotificacionForms.tsx — Client Components A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error de cada accion
// sin que estas llamen a redirect() (ver actions.ts), y useActionRedirect
// para navegar a donde apunta la notificación.
// ============================================================================

import { useActionState, type ReactNode } from 'react';
import { INITIAL_ACTION_STATE, type ActionState } from '@/lib/action-state';
import { useActionRedirect } from '@/components/ui/useActionRedirect';
import { Button } from '@/components/ui/Button';

type Action = (prevState: ActionState) => Promise<ActionState>;

export function MarcarTodasLeidasButton({ action, label }: { action: Action; label: string }) {
  const [, formAction, pending] = useActionState(action, INITIAL_ACTION_STATE);

  return (
    <form action={formAction}>
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {label}
      </Button>
    </form>
  );
}

export function NotificationRow({ action, children }: { action: Action; children: ReactNode }) {
  const [state, formAction] = useActionState(action, INITIAL_ACTION_STATE);
  useActionRedirect(state);

  return (
    <form action={formAction}>
      <button type="submit" className="block w-full text-left">
        {children}
      </button>
    </form>
  );
}
