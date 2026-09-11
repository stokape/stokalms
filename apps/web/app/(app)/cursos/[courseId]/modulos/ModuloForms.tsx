'use client';

// ============================================================================
// ModuloForms.tsx — Client Components A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error de cada accion
// sin que estas llamen a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { crearModulo, actualizarModulo, eliminarModulo } from './actions';

export function ActualizarModuloForm({
  courseId,
  moduleId,
  title,
  saveLabel,
  savingLabel,
}: {
  courseId: string;
  moduleId: string;
  title: string;
  saveLabel: string;
  savingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    actualizarModulo.bind(null, courseId, moduleId),
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction} className="flex items-center gap-1">
        <input
          name="title"
          type="text"
          defaultValue={title}
          required
          className="w-40 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button type="submit" disabled={pending} className="text-xs underline">
          {pending ? savingLabel : saveLabel}
        </button>
      </form>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </div>
  );
}

export function EliminarModuloButton({
  courseId,
  moduleId,
  confirmMessage,
  label,
}: {
  courseId: string;
  moduleId: string;
  confirmMessage: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(
    eliminarModulo.bind(null, courseId, moduleId),
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

export function CrearModuloForm({
  courseId,
  placeholder,
  submitLabel,
  submittingLabel,
}: {
  courseId: string;
  placeholder: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(crearModulo.bind(null, courseId), INITIAL_ACTION_STATE);

  return (
    <>
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="flex max-w-sm gap-2">
        <input
          name="title"
          type="text"
          required
          placeholder={placeholder}
          className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <Button type="submit" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </>
  );
}
