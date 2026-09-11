'use client';

// ============================================================================
// AssessmentForms.tsx — Client Components A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error de cada accion
// sin que estas llamen a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { crearPregunta, eliminarPregunta, calificarRespuesta } from './actions';

export function EliminarPreguntaButton({
  courseId,
  assessmentId,
  questionId,
  confirmMessage,
  label,
}: {
  courseId: string;
  assessmentId: string;
  questionId: string;
  confirmMessage: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(
    eliminarPregunta.bind(null, courseId, assessmentId, questionId),
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

export function CalificarRespuestaForm({
  courseId,
  assessmentId,
  submissionId,
  questionId,
  scorePlaceholder,
  commentPlaceholder,
  submitLabel,
  submittingLabel,
}: {
  courseId: string;
  assessmentId: string;
  submissionId: string;
  questionId: string;
  scorePlaceholder: string;
  commentPlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    calificarRespuesta.bind(null, courseId, assessmentId, submissionId, questionId),
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="mt-1 flex flex-col gap-1">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input
          name="score"
          type="number"
          min={0}
          step="0.01"
          required
          placeholder={scorePlaceholder}
          className="w-24 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          name="feedback"
          type="text"
          placeholder={commentPlaceholder}
          className="flex-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          {pending ? submittingLabel : submitLabel}
        </button>
      </form>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </div>
  );
}

interface QuestionFormText {
  points: string;
  fillMatchingType: string;
  mcqLabel: string;
  optionsPlaceholder: string;
  correctPlaceholder: string;
  allowMultiple: string;
  tfLabel: string;
  statementPlaceholder: string;
  true: string;
  false: string;
  matchingLabel: string;
  leftPlaceholder: string;
  rightPlaceholder: string;
  pairsPlaceholder: string;
  openLabel: string;
  promptPlaceholder: string;
  addQuestionSubmit: string;
  addingQuestion: string;
}

export function CrearPreguntaForm({
  courseId,
  assessmentId,
  typeLabels,
  t,
}: {
  courseId: string;
  assessmentId: string;
  typeLabels: Record<string, string>;
  t: QuestionFormText;
}) {
  const [state, formAction, pending] = useActionState(
    crearPregunta.bind(null, courseId, assessmentId),
    INITIAL_ACTION_STATE,
  );

  return (
    <>
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form
        action={formAction}
        className="mb-10 flex max-w-xl flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <div className="flex gap-2">
          <select name="type" required className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
            <option value="mcq">{typeLabels.mcq}</option>
            <option value="tf">{typeLabels.tf}</option>
            <option value="matching">{typeLabels.matching}</option>
            <option value="open">{typeLabels.open}</option>
          </select>
          <input
            name="points"
            type="number"
            min={0}
            step="0.01"
            required
            placeholder={t.points}
            className="w-28 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <p className="text-xs text-zinc-500">{t.fillMatchingType}</p>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">{t.mcqLabel}</label>
          <textarea
            name="options"
            rows={3}
            placeholder={t.optionsPlaceholder}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <div className="mt-1 flex items-center gap-3">
            <input
              name="correctIndexes"
              type="text"
              placeholder={t.correctPlaceholder}
              className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <label className="flex items-center gap-1 text-xs text-zinc-500">
              <input type="checkbox" name="allowMultiple" /> {t.allowMultiple}
            </label>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">{t.tfLabel}</label>
          <input
            name="statement"
            type="text"
            placeholder={t.statementPlaceholder}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <div className="mt-1 flex gap-3 text-xs text-zinc-500">
            <label className="flex items-center gap-1">
              <input type="radio" name="correctValue" value="true" /> {t.true}
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="correctValue" value="false" /> {t.false}
            </label>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">{t.matchingLabel}</label>
          <div className="flex gap-2">
            <textarea
              name="leftItems"
              rows={3}
              placeholder={t.leftPlaceholder}
              className="w-1/2 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <textarea
              name="rightItems"
              rows={3}
              placeholder={t.rightPlaceholder}
              className="w-1/2 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <input
            name="pairs"
            type="text"
            placeholder={t.pairsPlaceholder}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">{t.openLabel}</label>
          <input
            name="prompt"
            type="text"
            placeholder={t.promptPlaceholder}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <Button type="submit" className="self-start" disabled={pending}>
          {pending ? t.addingQuestion : t.addQuestionSubmit}
        </Button>
      </form>
    </>
  );
}
