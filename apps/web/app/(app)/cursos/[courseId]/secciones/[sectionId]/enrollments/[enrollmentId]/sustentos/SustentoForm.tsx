'use client';

// ============================================================================
// SustentoForm.tsx — Client Component A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error de subirSustento
// sin que esta llame a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Button } from '@/components/ui/Button';
import { subirSustento } from './actions';

export function SustentoForm({
  courseId,
  sectionId,
  enrollmentId,
  descriptionPlaceholder,
  submitLabel,
  submittingLabel,
}: {
  courseId: string;
  sectionId: string;
  enrollmentId: string;
  descriptionPlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    subirSustento.bind(null, courseId, sectionId, enrollmentId),
    INITIAL_ACTION_STATE,
  );

  return (
    <>
      {state.error && (
        <div className="mb-6">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="flex max-w-sm flex-col gap-3">
        <input name="file" type="file" required className="text-sm" />
        <input
          name="description"
          type="text"
          placeholder={descriptionPlaceholder}
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <Button type="submit" className="self-start" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </>
  );
}
