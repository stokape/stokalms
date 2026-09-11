'use client';

// ============================================================================
// LeccionForms.tsx — Client Components A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error de cada accion
// sin que estas llamen a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { crearLeccion, actualizarModulo, actualizarLeccionTitulo, eliminarLeccion } from './actions';

export function RenombrarModuloForm({
  courseId,
  moduleId,
  title,
  submitLabel,
  submittingLabel,
}: {
  courseId: string;
  moduleId: string;
  title: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    actualizarModulo.bind(null, courseId, moduleId),
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="mb-8 max-w-sm">
      {state.error && (
        <div className="mb-2">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="flex gap-2">
        <input
          name="title"
          type="text"
          defaultValue={title}
          required
          className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          {pending ? submittingLabel : submitLabel}
        </button>
      </form>
    </div>
  );
}

export function ActualizarLeccionTituloForm({
  courseId,
  moduleId,
  lessonId,
  title,
  saveLabel,
  savingLabel,
}: {
  courseId: string;
  moduleId: string;
  lessonId: string;
  title: string;
  saveLabel: string;
  savingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    actualizarLeccionTitulo.bind(null, courseId, moduleId, lessonId),
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

export function EliminarLeccionButton({
  courseId,
  moduleId,
  lessonId,
  confirmMessage,
  label,
}: {
  courseId: string;
  moduleId: string;
  lessonId: string;
  confirmMessage: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(
    eliminarLeccion.bind(null, courseId, moduleId, lessonId),
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

export function CrearLeccionForm({
  courseId,
  moduleId,
  titlePlaceholder,
  contentPlaceholder,
  submitLabel,
  submittingLabel,
}: {
  courseId: string;
  moduleId: string;
  titlePlaceholder: string;
  contentPlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    crearLeccion.bind(null, courseId, moduleId),
    INITIAL_ACTION_STATE,
  );

  return (
    <>
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="mb-10 flex max-w-xl flex-col gap-3">
        <input
          name="title"
          type="text"
          required
          placeholder={titlePlaceholder}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <textarea
          name="content"
          rows={6}
          placeholder={contentPlaceholder}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <Button type="submit" className="self-start" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </>
  );
}
