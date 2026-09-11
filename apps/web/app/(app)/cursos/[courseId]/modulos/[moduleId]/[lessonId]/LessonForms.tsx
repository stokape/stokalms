'use client';

// ============================================================================
// LessonForms.tsx — Client Components A PROPOSITO (ver periodos/PeriodosForms.tsx):
// useActionState necesita el cliente para mostrar el error/resultado de cada
// accion sin que estas llamen a redirect() (ver actions.ts).
// ============================================================================

import { useActionState } from 'react';
import { INITIAL_ACTION_STATE } from '@/lib/action-state';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import {
  actualizarLeccion,
  actualizarRecurso,
  subirRecurso,
  crearRecursoEnlace,
  eliminarRecurso,
  generarPreguntasIA,
  type AiActionState,
} from './actions';

const INITIAL_AI_STATE: AiActionState = { error: null };

export function ActualizarLeccionForm({
  courseId,
  moduleId,
  lessonId,
  title,
  content,
  contentPlaceholder,
  submitLabel,
  submittingLabel,
}: {
  courseId: string;
  moduleId: string;
  lessonId: string;
  title: string;
  content: string;
  contentPlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    actualizarLeccion.bind(null, courseId, moduleId, lessonId),
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="mb-8">
      {state.error && (
        <div className="mb-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      <form action={formAction} className="flex flex-col gap-3">
        <input
          name="title"
          type="text"
          defaultValue={title}
          required
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <textarea
          name="content"
          rows={8}
          defaultValue={content}
          placeholder={contentPlaceholder}
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          {pending ? submittingLabel : submitLabel}
        </button>
      </form>
    </div>
  );
}

export function GenerarPreguntasIA({
  courseId,
  moduleId,
  lessonId,
  generateLabel,
  generatingLabel,
  notConfiguredLabel,
  resultTitle,
  resultHelp,
  correctLabel,
}: {
  courseId: string;
  moduleId: string;
  lessonId: string;
  generateLabel: string;
  generatingLabel: string;
  notConfiguredLabel: string;
  resultTitle: string;
  resultHelp: string;
  correctLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    generarPreguntasIA.bind(null, courseId, moduleId, lessonId),
    INITIAL_AI_STATE,
  );

  return (
    <div className="mb-8">
      <form action={formAction}>
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? generatingLabel : generateLabel}
        </Button>
      </form>

      {state.error && (
        <div className="mt-3">
          <ErrorBanner message={state.error} />
        </div>
      )}
      {state.notConfigured && (
        <div className="mt-3 rounded-lg border border-warning/30 bg-warning-bg p-4 text-sm text-warning">
          {notConfiguredLabel}
        </div>
      )}

      {state.questions && state.questions.length > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-black/[.015] p-4 dark:bg-white/[.02]">
          <h3 className="mb-1 text-sm font-semibold">{resultTitle}</h3>
          <p className="mb-3 text-xs text-muted">{resultHelp}</p>
          <ol className="flex flex-col gap-4 text-sm">
            {state.questions.map((q, i) => (
              <li key={i}>
                <p className="font-medium">
                  {i + 1}. {q.prompt}
                </p>
                <ul className="mt-1.5 flex flex-col gap-1 pl-4">
                  {q.options.map((opt, j) => (
                    <li key={j} className={j === q.correctIndex ? 'font-medium text-success' : 'text-muted'}>
                      {opt}
                      {j === q.correctIndex && ` — ${correctLabel}`}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export function EliminarRecursoButton({
  courseId,
  moduleId,
  lessonId,
  resourceId,
  confirmMessage,
  label,
}: {
  courseId: string;
  moduleId: string;
  lessonId: string;
  resourceId: string;
  confirmMessage: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(
    eliminarRecurso.bind(null, courseId, moduleId, lessonId, resourceId),
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

export function ActualizarRecursoForm({
  courseId,
  moduleId,
  lessonId,
  resourceId,
  title,
  description,
  url,
  isLink,
  titlePlaceholder,
  descriptionPlaceholder,
  saveLabel,
  savingLabel,
}: {
  courseId: string;
  moduleId: string;
  lessonId: string;
  resourceId: string;
  title: string;
  description: string;
  url: string;
  isLink: boolean;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  saveLabel: string;
  savingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    actualizarRecurso.bind(null, courseId, moduleId, lessonId, resourceId),
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="flex flex-col gap-1">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input
          name="title"
          type="text"
          defaultValue={title}
          placeholder={titlePlaceholder}
          className="w-48 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          name="description"
          type="text"
          defaultValue={description}
          placeholder={descriptionPlaceholder}
          className="w-48 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
        />
        {isLink && (
          <input
            name="url"
            type="url"
            defaultValue={url}
            placeholder="https://..."
            className="w-48 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
          />
        )}
        <button type="submit" disabled={pending} className="text-xs underline">
          {pending ? savingLabel : saveLabel}
        </button>
      </form>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </div>
  );
}

export function SubirRecursoForm({
  courseId,
  moduleId,
  lessonId,
  displayNamePlaceholder,
  submitLabel,
  submittingLabel,
}: {
  courseId: string;
  moduleId: string;
  lessonId: string;
  displayNamePlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    subirRecurso.bind(null, courseId, moduleId, lessonId),
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
        <input
          name="title"
          type="text"
          placeholder={displayNamePlaceholder}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          name="file"
          type="file"
          required
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,image/*,video/*,.zip"
          className="text-sm"
        />
        <Button type="submit" className="self-start" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </>
  );
}

export function CrearRecursoEnlaceForm({
  courseId,
  moduleId,
  lessonId,
  linkTitlePlaceholder,
  descriptionPlaceholder,
  submitLabel,
  submittingLabel,
}: {
  courseId: string;
  moduleId: string;
  lessonId: string;
  linkTitlePlaceholder: string;
  descriptionPlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    crearRecursoEnlace.bind(null, courseId, moduleId, lessonId),
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
        <input
          name="title"
          type="text"
          required
          placeholder={linkTitlePlaceholder}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          name="url"
          type="url"
          required
          placeholder="https://..."
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          name="description"
          type="text"
          placeholder={descriptionPlaceholder}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <Button type="submit" className="self-start" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
      </form>
    </>
  );
}
