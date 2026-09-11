'use client';

// ============================================================================
// PlantillaForms.tsx — Client Components A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error/éxito de cada
// accion sin que estas llamen a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { useActionRedirect } from '@/components/ui/useActionRedirect';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuccessBanner } from '@/components/SuccessBanner';
import { fieldClasses } from '@/components/ui/field-styles';
import { editarPlantilla, eliminarPlantilla, type PlantillaActionState } from './actions';

const INITIAL_STATE: PlantillaActionState = { error: null };

export function EditarPlantillaForm({
  templateId,
  name,
  htmlTemplate,
  submitLabel,
  submittingLabel,
  savedLabel,
}: {
  templateId: string;
  name: string;
  htmlTemplate: string;
  submitLabel: string;
  submittingLabel: string;
  savedLabel: string;
}) {
  const [state, formAction, pending] = useActionState(editarPlantilla.bind(null, templateId), INITIAL_STATE);

  return (
    <>
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      {state.saved && (
        <div className="mb-3">
          <SuccessBanner>{savedLabel}</SuccessBanner>
        </div>
      )}
      <form action={formAction} className="flex flex-col gap-3">
        <input name="name" type="text" required defaultValue={name} className={fieldClasses} />
        <textarea
          name="htmlTemplate"
          required
          rows={12}
          defaultValue={htmlTemplate}
          className={`${fieldClasses} font-mono text-xs`}
        />
        <Button type="submit" className="self-start" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </>
  );
}

export function EliminarPlantillaButton({
  templateId,
  confirmMessage,
  label,
}: {
  templateId: string;
  confirmMessage: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(eliminarPlantilla.bind(null, templateId), INITIAL_STATE);
  useActionRedirect(state);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" disabled={pending} className="text-sm font-medium text-danger hover:underline">
        {label}
      </button>
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </form>
  );
}
