'use client';

// ============================================================================
// CrearPlantillaForm.tsx — Client Component A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error de crearPlantilla
// sin que esta llame a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { fieldClasses } from '@/components/ui/field-styles';
import { crearPlantilla } from './actions';

export function CrearPlantillaForm({
  namePlaceholder,
  defaultName,
  formKey,
  defaultHtml,
  submitLabel,
  submittingLabel,
}: {
  namePlaceholder: string;
  defaultName: string;
  formKey: string;
  defaultHtml: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(crearPlantilla, INITIAL_ACTION_STATE);

  return (
    <>
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="flex flex-col gap-3">
        <input
          key={`name-${formKey}`}
          name="name"
          type="text"
          required
          placeholder={namePlaceholder}
          defaultValue={defaultName}
          className={fieldClasses}
        />
        <textarea
          key={`html-${formKey}`}
          name="htmlTemplate"
          required
          rows={12}
          defaultValue={defaultHtml}
          className={`${fieldClasses} font-mono text-xs`}
        />
        <Button type="submit" className="self-start" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </>
  );
}
