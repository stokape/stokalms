'use client';

// ============================================================================
// CourseDetailForms.tsx — Client Components A PROPOSITO (mismo criterio que
// periodos/PeriodosForms.tsx): "useActionState" necesita ejecutarse en el
// cliente para poder mostrar el error de una Server Action SIN que esta
// llame a redirect() -- ver la nota extensa en actions.ts.
// ============================================================================

import { useActionState } from 'react';
import { useActionRedirect } from '@/components/ui/useActionRedirect';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { selectClasses } from '@/components/ui/field-styles';
import { asignarEscalaDeNotas, asignarPlantillaDeCertificado, eliminarCurso } from './actions';

export function PendingSetupCard({
  courseId,
  kind,
  message,
  emptyMessage,
  isEmpty,
  fieldName,
  options,
  assignLabel,
  assigningLabel,
}: {
  courseId: string;
  kind: 'gradingScale' | 'certificateTemplate';
  message: string;
  emptyMessage: string;
  isEmpty: boolean;
  fieldName: string;
  options: { id: string; name: string }[];
  assignLabel: string;
  assigningLabel: string;
}) {
  const action = kind === 'gradingScale' ? asignarEscalaDeNotas : asignarPlantillaDeCertificado;
  const [state, formAction, pending] = useActionState(action.bind(null, courseId), INITIAL_ACTION_STATE);

  return (
    <div className="mb-6 rounded-xl border border-warning/30 bg-warning-bg p-4">
      <p className="mb-3 text-sm text-warning">{message}</p>
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      {isEmpty ? (
        <p className="text-sm text-warning">{emptyMessage}</p>
      ) : (
        <form action={formAction} className="flex max-w-sm flex-wrap gap-2">
          <select name={fieldName} required className={selectClasses + ' flex-1'}>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <Button type="submit" size="md" disabled={pending}>
            {pending ? assigningLabel : assignLabel}
          </Button>
        </form>
      )}
    </div>
  );
}

export function EliminarCursoButton({
  courseId,
  confirmMessage,
  label,
  deletingLabel,
}: {
  courseId: string;
  confirmMessage: string;
  label: string;
  deletingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(eliminarCurso.bind(null, courseId), INITIAL_ACTION_STATE);
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
        {pending ? deletingLabel : label}
      </Button>
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </form>
  );
}
