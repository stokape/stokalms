'use client';

// ============================================================================
// EnrollmentForms.tsx — Client Components A PROPOSITO (mismo criterio que
// periodos/PeriodosForms.tsx): "useActionState" necesita ejecutarse en el
// cliente para poder mostrar el error/resultado de una Server Action SIN
// que esta llame a redirect() -- ver la nota extensa en actions.ts.
// ============================================================================

import { useActionState } from 'react';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuccessBanner } from '@/components/SuccessBanner';
import { fieldClasses, fileInputClasses } from '@/components/ui/field-styles';
import {
  matricular,
  matricularCSV,
  importarMatriculaHistoricaCSV,
  cambiarEstadoMatricula,
  retirarConSustento,
  type BulkActionState,
} from './actions';

const INITIAL_BULK_STATE: BulkActionState = { error: null };

export function MarkCompletedButton({
  courseId,
  sectionId,
  enrollmentId,
  label,
}: {
  courseId: string;
  sectionId: string;
  enrollmentId: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(
    cambiarEstadoMatricula.bind(null, courseId, sectionId, enrollmentId, 'completed'),
    INITIAL_ACTION_STATE,
  );

  return (
    <form action={formAction}>
      <button type="submit" disabled={pending} className="text-xs font-medium text-success hover:underline">
        {label}
      </button>
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </form>
  );
}

export function WithdrawForm({
  courseId,
  sectionId,
  enrollmentId,
  supportTitle,
  confirmMessage,
  label,
}: {
  courseId: string;
  sectionId: string;
  enrollmentId: string;
  supportTitle: string;
  confirmMessage: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(
    retirarConSustento.bind(null, courseId, sectionId, enrollmentId),
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-1"
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <input name="file" type="file" title={supportTitle} className={'w-40 ' + fileInputClasses} />
      <button type="submit" disabled={pending} className="text-xs font-medium text-danger hover:underline">
        {label}
      </button>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </form>
  );
}

export function EnrollForm({
  courseId,
  sectionId,
  emailPlaceholder,
  fullNamePlaceholder,
  submitLabel,
  submittingLabel,
}: {
  courseId: string;
  sectionId: string;
  emailPlaceholder: string;
  fullNamePlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    matricular.bind(null, courseId, sectionId),
    INITIAL_ACTION_STATE,
  );

  return (
    <>
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="flex flex-col gap-3">
        <input name="email" type="email" required placeholder={emailPlaceholder} className={fieldClasses} />
        <input
          name="fullName"
          type="text"
          maxLength={200}
          placeholder={fullNamePlaceholder}
          className={fieldClasses}
        />
        <Button type="submit" className="self-start" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </>
  );
}

export function BulkEnrollForm({
  courseId,
  sectionId,
  uploadLabel,
  uploadingLabel,
  bulkOk,
  withErrors,
  rowWord,
  rowsWord,
}: {
  courseId: string;
  sectionId: string;
  uploadLabel: string;
  uploadingLabel: string;
  bulkOk: (count: number, errorNote: string) => string;
  withErrors: (count: number, word: string) => string;
  rowWord: string;
  rowsWord: string;
}) {
  const [state, formAction, pending] = useActionState(
    matricularCSV.bind(null, courseId, sectionId),
    INITIAL_BULK_STATE,
  );

  return (
    <>
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      {state.result && (
        <div className="mb-3">
          <SuccessBanner>
            <p>
              {bulkOk(
                state.result.okCount,
                state.result.errors.length > 0
                  ? withErrors(state.result.errors.length, state.result.errors.length === 1 ? rowWord : rowsWord)
                  : '',
              )}
            </p>
            {state.result.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-danger">
                {state.result.errors.map((e, i) => (
                  <li key={i}>
                    {e.email}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </SuccessBanner>
        </div>
      )}
      <form action={formAction} className="flex flex-col gap-3">
        <input name="file" type="file" accept=".csv,text/csv" required className={fileInputClasses} />
        <Button type="submit" variant="secondary" className="self-start" disabled={pending}>
          {pending ? uploadingLabel : uploadLabel}
        </Button>
      </form>
    </>
  );
}

export function ImportHistoricalForm({
  courseId,
  sectionId,
  submitLabel,
  submittingLabel,
  importOk,
  withErrorsImport,
  rowWord,
  rowsWord,
}: {
  courseId: string;
  sectionId: string;
  submitLabel: string;
  submittingLabel: string;
  importOk: (count: number, errorNote: string) => string;
  withErrorsImport: (count: number, word: string) => string;
  rowWord: string;
  rowsWord: string;
}) {
  const [state, formAction, pending] = useActionState(
    importarMatriculaHistoricaCSV.bind(null, courseId, sectionId),
    INITIAL_BULK_STATE,
  );

  return (
    <>
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      {state.result && (
        <div className="mb-3">
          <SuccessBanner>
            <p>
              {importOk(
                state.result.okCount,
                state.result.errors.length > 0
                  ? withErrorsImport(
                      state.result.errors.length,
                      state.result.errors.length === 1 ? rowWord : rowsWord,
                    )
                  : '',
              )}
            </p>
            {state.result.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-danger">
                {state.result.errors.map((e, i) => (
                  <li key={i}>
                    {e.email}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </SuccessBanner>
        </div>
      )}
      <form action={formAction} className="flex flex-col gap-3">
        <input name="file" type="file" accept=".csv,text/csv" required className={fileInputClasses} />
        <Button type="submit" variant="secondary" className="self-start" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </>
  );
}
