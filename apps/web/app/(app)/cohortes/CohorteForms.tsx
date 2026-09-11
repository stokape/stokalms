'use client';

// ============================================================================
// CohorteForms.tsx — Client Components A PROPOSITO (mismo criterio que
// periodos/PeriodosForms.tsx): "useActionState" necesita ejecutarse en el
// cliente para poder mostrar el error de una Server Action SIN que esta
// llame a redirect() -- ver la nota extensa en actions.ts.
// ============================================================================

import { useActionState } from 'react';
import { useActionRedirect } from '@/components/ui/useActionRedirect';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { fieldClasses, labelClasses, selectClasses } from '@/components/ui/field-styles';
import { crearCohorte, eliminarCohorte, agregarMiembro, quitarMiembro } from './actions';

export function CrearGrupoForm({
  nameLabel,
  namePlaceholder,
  descriptionLabel,
  submitLabel,
  submittingLabel,
}: {
  nameLabel: string;
  namePlaceholder: string;
  descriptionLabel: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(crearCohorte, INITIAL_ACTION_STATE);

  return (
    <>
      {state.error && (
        <div className="mb-4">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={labelClasses}>{nameLabel}</span>
          <input name="name" type="text" required maxLength={120} placeholder={namePlaceholder} className={fieldClasses} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={labelClasses}>{descriptionLabel}</span>
          <input name="description" type="text" maxLength={500} className={fieldClasses} />
        </label>
        <Button type="submit" className="self-start" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </>
  );
}

export function EliminarGrupoButton({
  cohortId,
  confirmMessage,
  label,
}: {
  cohortId: string;
  confirmMessage: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(eliminarCohorte.bind(null, cohortId), INITIAL_ACTION_STATE);
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
      <Button type="submit" variant="danger" size="sm" disabled={pending}>
        {label}
      </Button>
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </form>
  );
}

export function QuitarMiembroButton({
  cohortId,
  userTenantId,
  confirmMessage,
  label,
}: {
  cohortId: string;
  userTenantId: string;
  confirmMessage: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(
    quitarMiembro.bind(null, cohortId, userTenantId),
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!window.confirm(confirmMessage)) {
            e.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className="text-xs font-medium text-danger hover:underline disabled:opacity-60"
        >
          {label}
        </button>
      </form>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </div>
  );
}

export function AgregarMiembroForm({
  cohortId,
  available,
  pickPersonLabel,
  addLabel,
  addingLabel,
}: {
  cohortId: string;
  available: Array<{ userTenantId: string; fullName: string; email: string }>;
  pickPersonLabel: string;
  addLabel: string;
  addingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(agregarMiembro.bind(null, cohortId), INITIAL_ACTION_STATE);

  return (
    <div>
      {state.error && (
        <div className="mb-2">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <select name="userTenantId" required className={`min-w-[220px] ${selectClasses}`}>
          <option value="">{pickPersonLabel}</option>
          {available.map((m) => (
            <option key={m.userTenantId} value={m.userTenantId}>
              {m.fullName} — {m.email}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? addingLabel : addLabel}
        </Button>
      </form>
    </div>
  );
}
