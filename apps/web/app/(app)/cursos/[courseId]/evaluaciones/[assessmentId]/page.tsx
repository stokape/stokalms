// ============================================================================
// .../evaluaciones/[assessmentId]/page.tsx — Detalle de una Evaluación:
// preguntas (con la respuesta correcta si el rol puede editarlas, ver
// question.service.ts en el backend), formulario para agregar preguntas, y
// las Entregas (propias si sos Estudiante, de todos si tenés
// "submission:grade" — el backend ya filtra esto, ver submission.service.ts
// findAllByAssessment) con calificación manual de respuestas abiertas.
//
// El formulario de "agregar pregunta" se muestra siempre, sin intentar
// adivinar el rol de antemano — mismo criterio ya usado en
// cursos/[courseId]/modulos/page.tsx: el backend es quien realmente lo
// permite o no (403), no hace falta duplicar esa lógica en el frontend.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
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

const TYPE_LABELS: Record<string, string> = {
  exam: 'Examen',
  assignment: 'Tarea',
  forum: 'Foro',
  rubric: 'Rúbrica',
  mcq: 'Opción múltiple',
  tf: 'Verdadero/Falso',
  matching: 'Emparejamiento',
  open: 'Respuesta abierta',
};

function questionSummary(q: Question): string {
  if (q.type === 'mcq') {
    const options = (q.body.options as { id: string; text: string }[] | undefined) ?? [];
    return options.map((o) => o.text).join(' / ');
  }
  if (q.type === 'tf') return String(q.body.statement ?? '');
  if (q.type === 'matching') {
    const left = (q.body.left as { text: string }[] | undefined) ?? [];
    const right = (q.body.right as { text: string }[] | undefined) ?? [];
    return `${left.length} elementos a emparejar con ${right.length} opciones`;
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

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/cursos/${courseId}/evaluaciones`}
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Evaluaciones
      </Link>
      <h1 className="mt-2 mb-1 text-2xl font-semibold">
        {assessment.config.title || `${TYPE_LABELS[assessment.type]} sin título`}
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        {TYPE_LABELS[assessment.type] ?? assessment.type} · {assessment.maxPoints} pts ·{' '}
        {assessment.maxAttempts} {assessment.maxAttempts === 1 ? 'intento' : 'intentos'}
      </p>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      <div className="mb-8">
        {submissions && canAttempt && (
          <Link
            href={`/cursos/${courseId}/evaluaciones/${assessmentId}/rendir`}
            className="rounded-full bg-foreground px-4 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Rendir examen
          </Link>
        )}
        {submissions && !canAttempt && (
          <p className="text-sm text-zinc-500">
            Ya usaste tus {assessment.maxAttempts}{' '}
            {assessment.maxAttempts === 1 ? 'intento' : 'intentos'} permitidos.
          </p>
        )}
      </div>

      <h2 className="mb-3 text-lg font-medium">Preguntas</h2>
      {questions.length === 0 ? (
        <p className="mb-8 text-zinc-500">Todavía no se agregó ninguna pregunta.</p>
      ) : (
        <ul className="mb-8 divide-y divide-zinc-200 dark:divide-zinc-800">
          {questions.map((q, i) => (
            <li key={q.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p>
                  {i + 1}. {questionSummary(q)}{' '}
                  <span className="text-sm text-zinc-500">
                    ({TYPE_LABELS[q.type] ?? q.type} · {q.points} pts)
                  </span>
                </p>
                {canSeeAnswers && (
                  <p className="text-xs text-green-700 dark:text-green-400">
                    Respuesta correcta: {JSON.stringify(q.correctAnswer)}
                  </p>
                )}
              </div>
              <form action={eliminarPregunta.bind(null, courseId, assessmentId, q.id)}>
                <button type="submit" className="text-xs text-red-600 underline dark:text-red-400">
                  Eliminar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-3 text-lg font-medium">Agregar una pregunta</h2>
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
            <option value="mcq">Opción múltiple</option>
            <option value="tf">Verdadero/Falso</option>
            <option value="matching">Emparejamiento</option>
            <option value="open">Respuesta abierta</option>
          </select>
          <input
            name="points"
            type="number"
            min={0}
            step="0.01"
            required
            placeholder="Puntos"
            className="w-28 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <p className="text-xs text-zinc-500">
          Completá solo los campos de abajo que correspondan al tipo elegido.
        </p>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Opción múltiple: una opción por línea
          </label>
          <textarea
            name="options"
            rows={3}
            placeholder={'Opción A\nOpción B\nOpción C'}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <div className="mt-1 flex items-center gap-3">
            <input
              name="correctIndexes"
              type="text"
              placeholder="Correctas (ej. 1 o 1,3)"
              className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <label className="flex items-center gap-1 text-xs text-zinc-500">
              <input type="checkbox" name="allowMultiple" /> Permite varias
            </label>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Verdadero/Falso: enunciado
          </label>
          <input
            name="statement"
            type="text"
            placeholder="Ej. La Tierra es plana"
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <div className="mt-1 flex gap-3 text-xs text-zinc-500">
            <label className="flex items-center gap-1">
              <input type="radio" name="correctValue" value="true" /> Verdadero
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="correctValue" value="false" /> Falso
            </label>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Emparejamiento: columna izquierda / derecha (una por línea) y pares correctos
          </label>
          <div className="flex gap-2">
            <textarea
              name="leftItems"
              rows={3}
              placeholder={'Elemento 1\nElemento 2'}
              className="w-1/2 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <textarea
              name="rightItems"
              rows={3}
              placeholder={'Opción 1\nOpción 2'}
              className="w-1/2 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <input
            name="pairs"
            type="text"
            placeholder="Pares correctos, ej. 1:2, 2:1 (una línea izquierda-derecha por par)"
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Respuesta abierta: consigna
          </label>
          <input
            name="prompt"
            type="text"
            placeholder="Ej. Explicá con tus palabras..."
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <button
          type="submit"
          className="self-start rounded-full bg-foreground px-4 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Agregar pregunta
        </button>
      </form>

      {submissions && (
        <>
          <h2 className="mb-3 text-lg font-medium">Entregas</h2>
          {submissions.length === 0 ? (
            <p className="text-zinc-500">Todavía no hay ninguna entrega.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {submissions.map((s) => (
                <li key={s.id} className="py-4">
                  <p className="font-medium">
                    {s.student.fullName}{' '}
                    <span className="text-sm font-normal text-zinc-500">
                      · intento {s.attemptNumber} ·{' '}
                      {new Date(s.submittedAt).toLocaleString('es-PE')}
                    </span>
                  </p>
                  <p className="mb-2 text-sm text-zinc-500">
                    Estado: {s.status}
                    {s.grade &&
                      ` · Nota: ${s.grade.finalScore}${s.grade.letterGrade ? ` (${s.grade.letterGrade})` : ''}${!s.grade.published ? ' (sin publicar)' : ''}`}
                  </p>
                  <ul className="ml-4 flex flex-col gap-2">
                    {s.answers.map((a) => {
                      const question = questions.find((q) => q.id === a.questionId);
                      return (
                        <li key={a.questionId} className="text-sm">
                          <p className="text-zinc-500">
                            {question ? questionSummary(question) : a.questionId}
                          </p>
                          <p>Respuesta: {JSON.stringify(a.answer)}</p>
                          {a.score !== null ? (
                            <p>
                              Puntaje: {a.score}
                              {a.feedback && ` · ${a.feedback}`}
                            </p>
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
                                placeholder="Puntaje"
                                className="w-24 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                              />
                              <input
                                name="feedback"
                                type="text"
                                placeholder="Comentario (opcional)"
                                className="flex-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                              />
                              <button
                                type="submit"
                                className="rounded-full border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                              >
                                Calificar
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
