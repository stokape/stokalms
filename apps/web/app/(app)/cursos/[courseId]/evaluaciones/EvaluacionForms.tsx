'use client';

// ============================================================================
// EvaluacionForms.tsx — Client Components A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error de cada accion
// sin que estas llamen a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { crearCategoria, crearEvaluacion, eliminarEvaluacion } from './actions';

export function EliminarEvaluacionButton({
  courseId,
  assessmentId,
  confirmMessage,
  label,
}: {
  courseId: string;
  assessmentId: string;
  confirmMessage: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(
    eliminarEvaluacion.bind(null, courseId, assessmentId),
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

export function CrearCategoriaForm({
  courseId,
  namePlaceholder,
  weightPlaceholder,
  dropLowestTitle,
  submitLabel,
  submittingLabel,
}: {
  courseId: string;
  namePlaceholder: string;
  weightPlaceholder: string;
  dropLowestTitle: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(crearCategoria.bind(null, courseId), INITIAL_ACTION_STATE);

  return (
    <>
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="mb-8 flex max-w-xl flex-wrap gap-2">
        <input
          name="name"
          type="text"
          required
          placeholder={namePlaceholder}
          className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          name="weightPct"
          type="number"
          min={0}
          max={100}
          required
          placeholder={weightPlaceholder}
          className="w-32 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          name="dropLowest"
          type="number"
          min={0}
          defaultValue={0}
          title={dropLowestTitle}
          className="w-24 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <Button type="submit" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </>
  );
}

export function CrearEvaluacionForm({
  courseId,
  typeLabels,
  categories,
  modules,
  preselectedModuleId,
  titlePlaceholder,
  noModuleLabel,
  maxPointsPlaceholder,
  maxAttemptsTitle,
  autoPublishLabel,
  submitLabel,
  submittingLabel,
}: {
  courseId: string;
  typeLabels: Record<string, string>;
  categories: Array<{ id: string; name: string }>;
  modules: Array<{ id: string; title: string }> | null;
  preselectedModuleId?: string;
  titlePlaceholder: string;
  noModuleLabel: string;
  maxPointsPlaceholder: string;
  maxAttemptsTitle: string;
  autoPublishLabel: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(crearEvaluacion.bind(null, courseId), INITIAL_ACTION_STATE);

  return (
    <>
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="flex max-w-xl flex-col gap-3">
        <input
          name="title"
          type="text"
          placeholder={titlePlaceholder}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <div className="flex gap-2">
          <select name="type" required className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
            <option value="exam">{typeLabels.exam}</option>
            <option value="assignment">{typeLabels.assignment}</option>
            <option value="forum">{typeLabels.forum}</option>
            <option value="rubric">{typeLabels.rubric}</option>
          </select>
          <select
            name="gradebookCategoryId"
            required
            className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {modules && modules.length > 0 && (
          <select
            name="moduleId"
            defaultValue={preselectedModuleId ?? ''}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">{noModuleLabel}</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        )}
        <div className="flex gap-2">
          <input
            name="maxPoints"
            type="number"
            min={0}
            step="0.01"
            required
            placeholder={maxPointsPlaceholder}
            className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            name="maxAttempts"
            type="number"
            min={1}
            defaultValue={1}
            title={maxAttemptsTitle}
            className="w-32 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input type="checkbox" name="autoPublish" />
          {autoPublishLabel}
        </label>
        <Button type="submit" className="self-start" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </>
  );
}
