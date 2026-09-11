'use client';

// ============================================================================
// ReporteForms.tsx — Client Components A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error de cada accion
// sin que estas llamen a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { crearReportePersonalizado, eliminarReportePersonalizado } from './actions';

export function CrearPresetForm({
  reportType,
  title,
  needsCourseNote,
  columns,
  columnsLabel,
  namePlaceholder,
  submitLabel,
  submittingLabel,
}: {
  reportType: string;
  title: string;
  needsCourseNote: string | null;
  columns: Array<{ key: string; label: string }>;
  columnsLabel: string;
  namePlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(crearReportePersonalizado, INITIAL_ACTION_STATE);

  return (
    <Card>
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      {needsCourseNote && <p className="mb-2 text-xs text-muted">{needsCourseNote}</p>}
      {state.error && (
        <div className="mb-2">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="reportType" value={reportType} />
        <input
          name="name"
          placeholder={namePlaceholder}
          required
          className="rounded-lg border border-border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1 text-xs font-medium text-muted">{columnsLabel}</legend>
          {columns.map((col) => (
            <label key={col.key} className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="columns" value={col.key} className="h-3.5 w-3.5" />
              {col.label}
            </label>
          ))}
        </fieldset>
        <Button type="submit" variant="secondary" size="sm" className="self-start" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </Card>
  );
}

export function EliminarPresetButton({
  presetId,
  confirmMessage,
  label,
}: {
  presetId: string;
  confirmMessage: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(
    eliminarReportePersonalizado.bind(null, presetId),
    INITIAL_ACTION_STATE,
  );

  return (
    <>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!window.confirm(confirmMessage)) {
            e.preventDefault();
          }
        }}
      >
        <button type="submit" disabled={pending} className="text-xs font-medium text-danger hover:underline">
          {label}
        </button>
      </form>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </>
  );
}
