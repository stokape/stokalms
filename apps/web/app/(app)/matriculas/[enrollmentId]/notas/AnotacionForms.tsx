'use client';

// ============================================================================
// AnotacionForms.tsx — Client Components A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error de cada accion
// sin que estas llamen a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { crearAnotacion, eliminarAnotacion } from './actions';

export function EliminarAnotacionButton({
  enrollmentId,
  noteId,
  confirmMessage,
  label,
}: {
  enrollmentId: string;
  noteId: string;
  confirmMessage: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(
    eliminarAnotacion.bind(null, enrollmentId, noteId),
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="mt-1">
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

export function CrearAnotacionForm({
  enrollmentId,
  placeholder,
  submitLabel,
  submittingLabel,
}: {
  enrollmentId: string;
  placeholder: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    crearAnotacion.bind(null, enrollmentId),
    INITIAL_ACTION_STATE,
  );

  return (
    <>
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="flex max-w-xl flex-col gap-3">
        <textarea
          name="body"
          rows={4}
          required
          maxLength={2000}
          placeholder={placeholder}
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <Button type="submit" className="self-start" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </>
  );
}
