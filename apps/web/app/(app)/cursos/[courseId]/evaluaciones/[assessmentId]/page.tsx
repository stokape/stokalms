// ============================================================================
// .../evaluaciones/[assessmentId]/page.tsx — Detalle de una Evaluación:
// preguntas (con la respuesta correcta si el rol puede editarlas, ver
// question.service.ts en el backend), formulario para agregar preguntas, y
// las Entregas (propias si eres Estudiante, de todas si tienes
// "submission:grade" — el backend ya filtra esto, ver submission.service.ts
// findAllByAssessment) con calificación manual de respuestas abiertas.
//
// El formulario de "agregar pregunta" se oculta segun "canSeeAnswers"
// (misma señal que ya calcula el backend para decidir si mostrar
// "correctAnswer", ver question.service.ts — ambas cosas dependen del
// MISMO permiso, "assessment:edit") y "Rendir examen" segun
// "submission:create" (ver lib/api.ts, getCoursePermissions).
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage, getCoursePermissions, can } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Button } from '@/components/ui/Button';
import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmitButton';
import { LinkButton } from '@/components/ui/LinkButton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getLocale, type Locale } from '@/lib/locale';
import { crearPregunta, eliminarPregunta, calificarRespuesta } from './actions';

interface Assessment {
  id: string;
  type: string;
  maxPoints: number;
  maxAttempts: number;
  config: { title?: string };
}

interface Question {
  id: string;
  type: string;
  body: Record<string, unknown>;
  correctAnswer?: Record<string, unknown>;
  points: number;
}

interface SubmissionAnswer {
  questionId: string;
  answer: unknown;
  score: number | null;
  feedback: string | null;
}

interface Submission {
  id: string;
  attemptNumber: number;
  status: string;
  submittedAt: string;
  student: { fullName: string; email: string };
  answers: SubmissionAnswer[];
  grade: { finalScore: number; letterGrade: string | null; published: boolean } | null;
}

const TYPE_LABELS_BY_LOCALE: Record<Locale, Record<string, string>> = {
  es: {
    exam: 'Examen', assignment: 'Tarea', forum: 'Foro', rubric: 'Rúbrica',
    mcq: 'Opción múltiple', tf: 'Verdadero/Falso', matching: 'Emparejamiento', open: 'Respuesta abierta',
  },
  en: {
    exam: 'Exam', assignment: 'Assignment', forum: 'Forum', rubric: 'Rubric',
    mcq: 'Multiple choice', tf: 'True/False', matching: 'Matching', open: 'Open answer',
  },
};

const TEXT = {
  es: {
    back: 'Evaluaciones',
    coursesBreadcrumb: 'Cursos',
    untitled: (type: string) => `${type} sin título`,
    attempt: 'intento',
    attempts: 'intentos',
    takeExam: 'Rendir examen',
    attemptsUsed: (max: number, word: string) => `Ya usaste tus ${max} ${word} permitidos.`,
    questions: 'Preguntas',
    noQuestions: 'Todavía no se agregó ninguna pregunta.',
    correctAnswer: 'Respuesta correcta',
    delete: 'Eliminar',
    deleteConfirm: '¿Eliminar esta pregunta? No se puede deshacer.',
    addQuestion: 'Agregar una pregunta',
    points: 'Puntos',
    fillMatchingType: 'Completa solo los campos de abajo que correspondan al tipo elegido.',
    mcqLabel: 'Opción múltiple: una opción por línea',
    optionsPlaceholder: 'Opción A\nOpción B\nOpción C',
    correctPlaceholder: 'Correctas (ej. 1 o 1,3)',
    allowMultiple: 'Permite varias',
    tfLabel: 'Verdadero/Falso: enunciado',
    statementPlaceholder: 'Ej. La Tierra es plana',
    true: 'Verdadero',
    false: 'Falso',
    matchingLabel: 'Emparejamiento: columna izquierda / derecha (una por línea) y pares correctos',
    leftPlaceholder: 'Elemento 1\nElemento 2',
    rightPlaceholder: 'Opción 1\nOpción 2',
    pairsPlaceholder: 'Pares correctos, ej. 1:2, 2:1 (una línea izquierda-derecha por par)',
    openLabel: 'Respuesta abierta: consigna',
    promptPlaceholder: 'Ej. Explica con tus palabras...',
    addQuestionSubmit: 'Agregar pregunta',
    submissions: 'Entregas',
    noSubmissions: 'Todavía no hay ninguna entrega.',
    attemptLabel: 'intento',
    status: 'Estado',
    grade: 'Nota',
    unpublished: '(sin publicar)',
    answer: 'Respuesta',
    score: 'Puntaje',
    pendingReview: 'Pendiente de revisión.',
    scorePlaceholder: 'Puntaje',
    commentPlaceholder: 'Comentario (opcional)',
    gradeSubmit: 'Calificar',
    matchSummary: (left: number, right: number) => `${left} elementos a emparejar con ${right} opciones`,
  },
  en: {
    back: 'Assessments',
    coursesBreadcrumb: 'Courses',
    untitled: (type: string) => `Untitled ${type}`,
    attempt: 'attempt',
    attempts: 'attempts',
    takeExam: 'Take exam',
    attemptsUsed: (max: number, word: string) => `You've already used your ${max} allowed ${word}.`,
    questions: 'Questions',
    noQuestions: 'No questions have been added yet.',
    correctAnswer: 'Correct answer',
    delete: 'Delete',
    deleteConfirm: "Delete this question? This can't be undone.",
    addQuestion: 'Add a question',
    points: 'Points',
    fillMatchingType: 'Only fill in the fields below that match the type you chose.',
    mcqLabel: 'Multiple choice: one option per line',
    optionsPlaceholder: 'Option A\nOption B\nOption C',
    correctPlaceholder: 'Correct ones (e.g. 1 or 1,3)',
    allowMultiple: 'Allows several',
    tfLabel: 'True/False: statement',
    statementPlaceholder: 'E.g. The Earth is flat',
    true: 'True',
    false: 'False',
    matchingLabel: 'Matching: left / right column (one per line) and correct pairs',
    leftPlaceholder: 'Item 1\nItem 2',
    rightPlaceholder: 'Option 1\nOption 2',
    pairsPlaceholder: 'Correct pairs, e.g. 1:2, 2:1 (one left-right line per pair)',
    openLabel: 'Open answer: prompt',
    promptPlaceholder: 'E.g. Explain in your own words...',
    addQuestionSubmit: 'Add question',
    submissions: 'Submissions',
    noSubmissions: 'No submissions yet.',
    attemptLabel: 'attempt',
    status: 'Status',
    grade: 'Grade',
    unpublished: '(unpublished)',
    answer: 'Answer',
    score: 'Score',
    pendingReview: 'Pending review.',
    scorePlaceholder: 'Score',
    commentPlaceholder: 'Comment (optional)',
    gradeSubmit: 'Grade',
    matchSummary: (left: number, right: number) => `${left} items to match with ${right} options`,
  },
};

function questionSummary(q: Question, t: (typeof TEXT)['es']): string {
  if (q.type === 'mcq') {
    const options = (q.body.options as { id: string; text: string }[] | undefined) ?? [];
    return options.map((o) => o.text).join(' / ');
  }
  if (q.type === 'tf') return String(q.body.statement ?? '');
  if (q.type === 'matching') {
    const left = (q.body.left as { text: string }[] | undefined) ?? [];
    const right = (q.body.right as { text: string }[] | undefined) ?? [];
    return t.matchSummary(left.length, right.length);
  }
  return String(q.body.prompt ?? '');
}

export default async function EvaluacionDetallePage({
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
  const TYPE_LABELS = TYPE_LABELS_BY_LOCALE[locale];

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

  // Solo para el breadcrumb — best-effort, ver la misma nota en
  // modulos/[moduleId]/[lessonId]/page.tsx.
  let courseTitle = '';
  try {
    courseTitle = (await apiFetch<{ title: string }>(token, `/courses/${courseId}`)).title;
  } catch {
    // Intencionalmente silencioso.
  }

  // Presencia de "correctAnswer" es la señal que el propio backend ya
  // calcula para distinguir el rol (ver question.service.ts,
  // findAllByAssessment): si viene, este usuario puede editar la
  // evaluación.
  const canSeeAnswers = questions.some((q) => q.correctAnswer !== undefined);

  let submissions: Submission[] | null = null;
  try {
    submissions = await apiFetch<Submission[]>(
      token,
      `/courses/${courseId}/assessments/${assessmentId}/submissions`,
    );
  } catch {
    submissions = null;
  }

  const attemptsUsed = submissions?.length ?? 0;
  const canAttempt = attemptsUsed < assessment.maxAttempts;

  const permissions = await getCoursePermissions(token, courseId);
  const canSubmit = can(permissions, 'submission', 'create');
  const canGrade = can(permissions, 'submission', 'grade');
  const assessmentLabel = assessment.config.title || t.untitled(TYPE_LABELS[assessment.type]);

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs
        items={[
          { label: t.coursesBreadcrumb, href: '/cursos' },
          { label: courseTitle || courseId, href: `/cursos/${courseId}` },
          { label: t.back, href: `/cursos/${courseId}/evaluaciones` },
          { label: assessmentLabel },
        ]}
      />
      <h1 className="mt-1 mb-1 text-2xl font-semibold">{assessmentLabel}</h1>
      <p className="mb-6 text-sm text-zinc-500">
        {TYPE_LABELS[assessment.type] ?? assessment.type} · {assessment.maxPoints} pts ·{' '}
        {assessment.maxAttempts} {assessment.maxAttempts === 1 ? t.attempt : t.attempts}
      </p>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {canSubmit && (
        <div className="mb-8">
          {submissions && canAttempt && (
            <LinkButton href={`/cursos/${courseId}/evaluaciones/${assessmentId}/rendir`}>
              {t.takeExam}
            </LinkButton>
          )}
          {submissions && !canAttempt && (
            <p className="text-sm text-zinc-500">
              {t.attemptsUsed(assessment.maxAttempts, assessment.maxAttempts === 1 ? t.attempt : t.attempts)}
            </p>
          )}
        </div>
      )}

      <h2 className="mb-3 text-lg font-medium">{t.questions}</h2>
      {questions.length === 0 ? (
        <p className="mb-8 text-zinc-500">{t.noQuestions}</p>
      ) : (
        <ul className="mb-8 divide-y divide-zinc-200 dark:divide-zinc-800">
          {questions.map((q, i) => (
            <li key={q.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p>
                  {i + 1}. {questionSummary(q, t)}{' '}
                  <span className="text-sm text-zinc-500">
                    ({TYPE_LABELS[q.type] ?? q.type} · {q.points} pts)
                  </span>
                </p>
                {canSeeAnswers && (
                  <p className="text-xs text-green-700 dark:text-green-400">
                    {t.correctAnswer}: {JSON.stringify(q.correctAnswer)}
                  </p>
                )}
              </div>
              {canSeeAnswers && (
                <form action={eliminarPregunta.bind(null, courseId, assessmentId, q.id)}>
                  <ConfirmSubmitButton
                    className="text-xs text-red-600 underline dark:text-red-400"
                    confirmMessage={t.deleteConfirm}
                  >
                    {t.delete}
                  </ConfirmSubmitButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {canSeeAnswers && (
      <>
      <h2 className="mb-3 text-lg font-medium">{t.addQuestion}</h2>
      <form
        action={crearPregunta.bind(null, courseId, assessmentId)}
        className="mb-10 flex max-w-xl flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <div className="flex gap-2">
          <select
            name="type"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="mcq">{TYPE_LABELS.mcq}</option>
            <option value="tf">{TYPE_LABELS.tf}</option>
            <option value="matching">{TYPE_LABELS.matching}</option>
            <option value="open">{TYPE_LABELS.open}</option>
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

        <Button type="submit" className="self-start">
          {t.addQuestionSubmit}
        </Button>
      </form>
      </>
      )}

      {submissions && (
        <>
          <h2 className="mb-3 text-lg font-medium">{t.submissions}</h2>
          {submissions.length === 0 ? (
            <p className="text-zinc-500">{t.noSubmissions}</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {submissions.map((s) => (
                <li key={s.id} className="py-4">
                  <p className="font-medium">
                    {s.student.fullName}{' '}
                    <span className="text-sm font-normal text-zinc-500">
                      · {t.attemptLabel} {s.attemptNumber} ·{' '}
                      {new Date(s.submittedAt).toLocaleString(locale === 'en' ? 'en-US' : 'es-PE')}
                    </span>
                  </p>
                  <p className="mb-2 text-sm text-zinc-500">
                    {t.status}: {s.status}
                    {s.grade &&
                      ` · ${t.grade}: ${s.grade.finalScore}${s.grade.letterGrade ? ` (${s.grade.letterGrade})` : ''}${!s.grade.published ? ` ${t.unpublished}` : ''}`}
                  </p>
                  <ul className="ml-4 flex flex-col gap-2">
                    {s.answers.map((a) => {
                      const question = questions.find((q) => q.id === a.questionId);
                      return (
                        <li key={a.questionId} className="text-sm">
                          <p className="text-zinc-500">
                            {question ? questionSummary(question, t) : a.questionId}
                          </p>
                          <p>{t.answer}: {JSON.stringify(a.answer)}</p>
                          {a.score !== null ? (
                            <p>
                              {t.score}: {a.score}
                              {a.feedback && ` · ${a.feedback}`}
                            </p>
                          ) : !canGrade ? (
                            <p className="text-zinc-500">{t.pendingReview}</p>
                          ) : (
                            <form
                              action={calificarRespuesta.bind(
                                null,
                                courseId,
                                assessmentId,
                                s.id,
                                a.questionId,
                              )}
                              className="mt-1 flex flex-wrap items-center gap-2"
                            >
                              <input
                                name="score"
                                type="number"
                                min={0}
                                step="0.01"
                                required
                                placeholder={t.scorePlaceholder}
                                className="w-24 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                              />
                              <input
                                name="feedback"
                                type="text"
                                placeholder={t.commentPlaceholder}
                                className="flex-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                              />
                              <button
                                type="submit"
                                className="rounded-full border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                              >
                                {t.gradeSubmit}
                              </button>
                            </form>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
