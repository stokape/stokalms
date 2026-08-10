// ============================================================================
// .../evaluaciones/[assessmentId]/rendir/page.tsx — Rendir un examen: un
// campo por pregunta, según su tipo. Las preguntas llegan SIN
// "correctAnswer" (ver question.service.ts en el backend, que se lo oculta
// a quien no tiene "assessment:edit") — el estudiante nunca las ve.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Button } from '@/components/ui/Button';
import { getLocale, type Locale } from '@/lib/locale';
import { entregarExamen } from './actions';

interface Assessment {
  config: { title?: string };
  type: string;
}

interface Question {
  id: string;
  type: string;
  body: Record<string, unknown>;
  points: number;
}

const TEXT = {
  es: {
    back: '← Volver',
    defaultTitle: 'Rendir evaluación',
    noQuestions: 'Esta evaluación todavía no tiene preguntas.',
    submit: 'Entregar',
    mcqPrompt: 'Elige la respuesta correcta',
    matchingPrompt: 'Empareja cada elemento con su opción correspondiente',
    true: 'Verdadero',
    false: 'Falso',
    choosePlaceholder: '-- elige una opción --',
  },
  en: {
    back: '← Back',
    defaultTitle: 'Take assessment',
    noQuestions: "This assessment doesn't have any questions yet.",
    submit: 'Submit',
    mcqPrompt: 'Choose the correct answer',
    matchingPrompt: 'Match each item with its corresponding option',
    true: 'True',
    false: 'False',
    choosePlaceholder: '-- choose an option --',
  },
};

export default async function RendirExamenPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; assessmentId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { courseId, assessmentId } = await params;
  const { error } = await searchParams;
  const token = await requireAccessToken();
  const locale = await getLocale();
  const t = TEXT[locale];

  let assessment: Assessment;
  let questions: Question[];
  try {
    [assessment, questions] = await Promise.all([
      apiFetch<Assessment>(token, `/courses/${courseId}/assessments/${assessmentId}`),
      apiFetch<Question[]>(token, `/courses/${courseId}/assessments/${assessmentId}/questions`),
    ]);
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/cursos/${courseId}/evaluaciones/${assessmentId}`}
        className="text-sm text-zinc-500 hover:underline"
      >
        {t.back}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">
        {assessment.config.title || t.defaultTitle}
      </h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {questions.length === 0 ? (
        <p className="text-zinc-500">{t.noQuestions}</p>
      ) : (
        <form action={entregarExamen.bind(null, courseId, assessmentId)} className="flex flex-col gap-8">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="mb-3 font-medium">
                {i + 1}. {questionPrompt(q, t)}{' '}
                <span className="text-sm font-normal text-zinc-500">({q.points} pts)</span>
              </p>
              <QuestionInput question={q} t={t} />
            </div>
          ))}
          <Button type="submit" size="lg" className="self-start">
            {t.submit}
          </Button>
        </form>
      )}
    </div>
  );
}

function questionPrompt(q: Question, t: (typeof TEXT)['es']): string {
  if (q.type === 'tf') return String(q.body.statement ?? '');
  if (q.type === 'open') return String(q.body.prompt ?? '');
  if (q.type === 'mcq') return t.mcqPrompt;
  return t.matchingPrompt;
}

function QuestionInput({ question, t }: { question: Question; t: (typeof TEXT)['es'] }) {
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
