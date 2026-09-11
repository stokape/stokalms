'use client';

// ============================================================================
// AsistenciaForm.tsx — Client Component A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error/éxito de
// marcarAsistencia sin que esta llame a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuccessBanner } from '@/components/SuccessBanner';
import { Button } from '@/components/ui/Button';
import { marcarAsistencia, type AsistenciaActionState } from './actions';

const INITIAL_STATE: AsistenciaActionState = { error: null };

interface RosterRow {
  enrollmentId: string;
  student: { fullName: string; email: string };
  status: 'present' | 'absent' | 'late' | 'excused' | null;
}

export function AsistenciaForm({
  courseId,
  sectionId,
  sessionDate,
  roster,
  statusOptions,
  studentLabel,
  statusLabel,
  submitLabel,
  submittingLabel,
  savedLabel,
}: {
  courseId: string;
  sectionId: string;
  sessionDate: string;
  roster: RosterRow[];
  statusOptions: Array<{ value: string; label: string }>;
  studentLabel: string;
  statusLabel: string;
  submitLabel: string;
  submittingLabel: string;
  savedLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    marcarAsistencia.bind(null, courseId, sectionId),
    INITIAL_STATE,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="sessionDate" value={sessionDate} />

      {state.error && (
        <div className="mb-6">
          <ErrorBanner message={state.error} />
        </div>
      )}
      {state.saved && <SuccessBanner>{savedLabel}</SuccessBanner>}

      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="py-2">{studentLabel}</th>
              <th className="py-2">{statusLabel}</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((row) => (
              <tr key={row.enrollmentId} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2">
                  {row.student.fullName}
                  <br />
                  <span className="text-xs text-zinc-500">{row.student.email}</span>
                </td>
                <td className="py-2">
                  <select
                    name={`status_${row.enrollmentId}`}
                    defaultValue={row.status ?? 'present'}
                    className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}
