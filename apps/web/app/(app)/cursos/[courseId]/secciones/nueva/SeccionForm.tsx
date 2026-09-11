'use client';

// ============================================================================
// SeccionForm.tsx — Client Component A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error de crearSeccion
// sin que esta llame a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { useActionRedirect } from '@/components/ui/useActionRedirect';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Button } from '@/components/ui/Button';
import { crearSeccion } from './actions';

export function SeccionForm({
  courseId,
  namePlaceholder,
  capacityLabel,
  submitLabel,
  submittingLabel,
}: {
  courseId: string;
  namePlaceholder: string;
  capacityLabel: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(crearSeccion.bind(null, courseId), INITIAL_ACTION_STATE);
  useActionRedirect(state);

  return (
    <>
      {state.error && (
        <div className="mb-6">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="flex max-w-sm flex-col gap-3">
        <input
          name="name"
          type="text"
          required
          placeholder={namePlaceholder}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <label className="text-xs text-zinc-500">
          {capacityLabel}
          <input
            name="capacity"
            type="number"
            min={0}
            defaultValue={0}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <Button type="submit" className="self-start" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </>
  );
}
