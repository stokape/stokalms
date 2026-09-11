'use client';

// ============================================================================
// SeguridadForm.tsx — Client Component A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error/éxito de
// guardarSeguridad sin que esta llame a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuccessBanner } from '@/components/SuccessBanner';
import { guardarSeguridad, type SeguridadActionState } from './actions';

const INITIAL_STATE: SeguridadActionState = { error: null };

export function SeguridadForm({
  require2FA,
  t,
}: {
  require2FA: boolean;
  t: {
    done: string;
    appliedTo: (n: number, pending: number) => string;
    require2FATitle: string;
    require2FAHelp: string;
    save: string;
    saving: string;
    limitationNote: string;
  };
}) {
  const [state, formAction, pending] = useActionState(guardarSeguridad, INITIAL_STATE);

  return (
    <Card className="mb-8">
      {state.error && (
        <div className="mb-4">
          <ErrorBanner message={state.error} />
        </div>
      )}
      {state.saved && (
        <div className="mb-4">
          <SuccessBanner>
            <p>{t.done}</p>
            {state.appliedTo !== undefined && (
              <p className="mt-1">{t.appliedTo(state.appliedTo, state.pending ?? 0)}</p>
            )}
          </SuccessBanner>
        </div>
      )}
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="require2FA"
            defaultChecked={require2FA}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
          />
          <span className="text-sm">
            <span className="font-medium">{t.require2FATitle}</span>
            <span className="block text-xs text-muted">{t.require2FAHelp}</span>
          </span>
        </label>
        <p className="rounded-lg bg-black/[.02] p-3 text-xs text-muted dark:bg-white/[.04]">{t.limitationNote}</p>
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? t.saving : t.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}
