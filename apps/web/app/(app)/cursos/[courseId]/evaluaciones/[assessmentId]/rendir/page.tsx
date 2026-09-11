// ============================================================================
// .../evaluaciones/[assessmentId]/rendir/page.tsx — Rendir un examen: un
// campo por pregunta, según su tipo. Las preguntas llegan SIN
// "correctAnswer" (ver question.service.ts en el backend, que se lo oculta
// a quien no tiene "assessment:edit") — el estudiante nunca las ve.
//
// El formulario vive en EntregarExamenForm.tsx (Client Component) A
// PROPOSITO -- ver la nota extensa en periodos/actions.ts: la Server Action
// ya NO llama a redirect(), necesita useActionState (solo disponible del
// lado del cliente).
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { getLocale } from '@/lib/locale';
import { EntregarExamenForm } from './EntregarExamenForm';

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
    submitting: 'Entregando…',
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
    submitting: 'Submitting…',
    mcqPrompt: 'Choose the correct answer',
    matchingPrompt: 'Match each item with its corresponding option',
    true: 'True',
    false: 'False',
    choosePlaceholder: '-- choose an option --',
  },
};

export default async function RendirExamenPage({
  params,
}: {
  params: Promise<{ courseId: string; assessmentId: string }>;
}) {
  const { courseId, assessmentId } = await params;
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

      {questions.length === 0 ? (
        <p className="text-zinc-500">{t.noQuestions}</p>
      ) : (
        <EntregarExamenForm courseId={courseId} assessmentId={assessmentId} questions={questions} t={t} />
      )}
    </div>
  );
}
