'use client';

// ============================================================================
// UsuariosForms.tsx — Client Components A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error/resultado de cada
// accion sin que estas llamen a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuccessBanner } from '@/components/SuccessBanner';
import { selectClasses, fileInputClasses } from '@/components/ui/field-styles';
import { asignarRol, quitarRol, asignarRolMasivo, asignarRolesCSV, type BulkRoleActionState } from './actions';

const INITIAL_BULK_STATE: BulkRoleActionState = { error: null };

export function QuitarRolButton({
  userTenantId,
  userRoleId,
  confirmMessage,
  label,
}: {
  userTenantId: string;
  userRoleId: string;
  confirmMessage: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(
    quitarRol.bind(null, userTenantId, userRoleId),
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
        <button type="submit" disabled={pending} className="text-xs font-medium text-danger hover:underline">
          {label}
        </button>
      </form>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </div>
  );
}

export function AsignarRolForm({
  userTenantId,
  roles,
  courses,
  scopeTitle,
  wholeTenantLabel,
  onlyInLabel,
  submitLabel,
  submittingLabel,
}: {
  userTenantId: string;
  roles: Array<{ id: string; name: string }>;
  courses: Array<{ id: string; title: string }> | null;
  scopeTitle: string;
  wholeTenantLabel: string;
  onlyInLabel: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    asignarRol.bind(null, userTenantId),
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <select name="roleId" required className={`max-w-[220px] ${selectClasses}`}>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {courses && courses.length > 0 && (
          <select name="scopeCourseId" defaultValue="" title={scopeTitle} className={`max-w-[220px] ${selectClasses}`}>
            <option value="">{wholeTenantLabel}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {onlyInLabel}: {c.title}
              </option>
            ))}
          </select>
        )}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </div>
  );
}

function BulkResult({
  result,
  okLabel,
  errorsNoteLabel,
  errorRowLabel,
}: {
  result: NonNullable<BulkRoleActionState['result']>;
  okLabel: (count: number, errorNote: string) => string;
  errorsNoteLabel: (n: number) => string;
  errorRowLabel: (email: string, message: string) => string;
}) {
  return (
    <SuccessBanner>
      <p>{okLabel(result.okCount, result.errors.length > 0 ? errorsNoteLabel(result.errors.length) : '')}</p>
      {result.errors.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-danger">
          {result.errors.map((e, i) => (
            <li key={i}>{errorRowLabel(e.email, e.message ?? '')}</li>
          ))}
        </ul>
      )}
    </SuccessBanner>
  );
}

export function AsignarRolMasivoForm({
  roles,
  hint,
  submitLabel,
  submittingLabel,
  okLabel,
  errorsNoteLabel,
  errorRowLabel,
}: {
  roles: Array<{ id: string; name: string }>;
  hint: string;
  submitLabel: string;
  submittingLabel: string;
  okLabel: (count: number, errorNote: string) => string;
  errorsNoteLabel: (n: number) => string;
  errorRowLabel: (email: string, message: string) => string;
}) {
  const [state, formAction, pending] = useActionState(asignarRolMasivo, INITIAL_BULK_STATE);

  return (
    <div className="mb-4">
      {state.error && (
        <div className="mb-2">
          <ErrorBanner message={state.error} />
        </div>
      )}
      {state.result && (
        <div className="mb-2">
          <BulkResult
            result={state.result}
            okLabel={okLabel}
            errorsNoteLabel={errorsNoteLabel}
            errorRowLabel={errorRowLabel}
          />
        </div>
      )}
      {/* Ver la nota en page.tsx: los checkboxes de cada fila viven fuera de
         este <form> y se asocian via el atributo "form" nativo, apuntando a
         este id -- sigue funcionando igual siendo este un Client Component. */}
      <form
        id="bulk-role-form"
        action={formAction}
        className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border bg-surface/50 px-4 py-3"
      >
        <p className="mr-2 flex-1 basis-full text-sm text-muted sm:basis-auto">{hint}</p>
        <select name="roleId" required className={`max-w-[200px] ${selectClasses}`}>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </div>
  );
}

export function AsignarRolesCSVForm({
  submitLabel,
  submittingLabel,
  okLabel,
  errorsNoteLabel,
  errorRowLabel,
}: {
  submitLabel: string;
  submittingLabel: string;
  okLabel: (count: number, errorNote: string) => string;
  errorsNoteLabel: (n: number) => string;
  errorRowLabel: (email: string, message: string) => string;
}) {
  const [state, formAction, pending] = useActionState(asignarRolesCSV, INITIAL_BULK_STATE);

  return (
    <>
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      {state.result && (
        <div className="mb-3">
          <BulkResult
            result={state.result}
            okLabel={okLabel}
            errorsNoteLabel={errorsNoteLabel}
            errorRowLabel={errorRowLabel}
          />
        </div>
      )}
      <form action={formAction} className="flex flex-wrap items-center gap-3">
        <input name="file" type="file" accept=".csv,text/csv" required className={fileInputClasses} />
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </>
  );
}
