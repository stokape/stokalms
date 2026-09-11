'use client';

// ============================================================================
// EntregarExamenForm.tsx — Client Component A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error de entregarExamen
// sin que esta llame a redirect() (ver actions.ts) -- y useActionRedirect
// para navegar de vuelta a la evaluación tras una entrega exitosa.
// ============================================================================

import { useActionState } from 'react';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { useActionRedirect } from '@/components/ui/useActionRedirect';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Button } from '@/components/ui/Button';
import { entregarExamen } from './actions';

interface Question {
  id: string;
  type: string;
  body: Record<string, unknown>;
  points: number;
}

interface Texts {
  mcqPrompt: string;
  matchingPrompt: string;
  true: string;
  false: string;
  choosePlaceholder: string;
  submit: string;
  submitting: string;
}

function questionPrompt(q: Question, t: Texts): string {
  if (q.type === 'tf') return String(q.body.statement ?? '');
  if (q.type === 'open') return String(q.body.prompt ?? '');
  if (q.type === 'mcq') return t.mcqPrompt;
  return t.matchingPrompt;
}

function QuestionInput({ question, t }: { question: Question; t: Texts }) {
  const field = `q_${question.id}`;

  if (question.type === 'mcq') {
    const options = (question.body.options as { id: string; text: string }[] | undefined) ?? [];
    const allowMultiple = Boolean(question.body.allowMultiple);
    return (
      <div className="flex flex-col gap-2">
        {options.map((o) => (
          <label key={o.id} className="flex items-center gap-2 text-sm">
            <input type={allowMultiple ? 'checkbox' : 'radio'} name={field} value={o.id} />
            {o.text}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === 'tf') {
    return (
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name={field} value="true" /> {t.true}
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name={field} value="false" /> {t.false}
        </label>
      </div>
    );
  }

  if (question.type === 'matching') {
    const left = (question.body.left as { id: string; text: string }[] | undefined) ?? [];
    const right = (question.body.right as { id: string; text: string }[] | undefined) ?? [];
    return (
      <div className="flex flex-col gap-2">
        {left.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            <span className="w-40">{item.text}</span>
            <select
              name={`${field}__${item.id}`}
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">{t.choosePlaceholder}</option>
              {right.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.text}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    );
  }

  return (
    <textarea
      name={field}
      rows={4}
      className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
    />
  );
}

export function EntregarExamenForm({
  courseId,
  assessmentId,
  questions,
  t,
}: {
  courseId: string;
  assessmentId: string;
  questions: Question[];
  t: Texts;
}) {
  const [state, formAction, pending] = useActionState(
    entregarExamen.bind(null, courseId, assessmentId),
    INITIAL_ACTION_STATE,
  );
  useActionRedirect(state);

  return (
    <>
      {state.error && (
        <div className="mb-6">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="flex flex-col gap-8">
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="mb-3 font-medium">
              {i + 1}. {questionPrompt(q, t)}{' '}
              <span className="text-sm font-normal text-zinc-500">({q.points} pts)</span>
            </p>
            <QuestionInput question={q} t={t} />
          </div>
        ))}
        <Button type="submit" size="lg" className="self-start" disabled={pending}>
          {pending ? t.submitting : t.submit}
        </Button>
      </form>
    </>
  );
}
