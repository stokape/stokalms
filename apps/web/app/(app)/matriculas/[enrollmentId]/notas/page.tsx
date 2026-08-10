// ============================================================================
// matriculas/[enrollmentId]/notas/page.tsx — Anotaciones de desempeño que un
// Docente deja sobre un alumno puntual (ver apps/api/.../student-notes/).
// A diferencia de una nota (Grade), esto no mide nada: es texto libre de
// seguimiento cualitativo ("mejoro su participacion", "no entrego la tarea 3").
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage, getPermissions, can } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Button } from '@/components/ui/Button';
import { getLocale } from '@/lib/locale';
import { crearAnotacion, eliminarAnotacion } from './actions';

const TEXT = {
  es: {
    back: '← Certificados de esta matrícula',
    title: 'Anotaciones de desempeño',
    empty: 'Todavía no hay ninguna anotación sobre este alumno.',
    delete: 'Eliminar',
    placeholder: 'Ej. Mejoró mucho su participación en las últimas clases.',
    submit: 'Agregar anotación',
  },
  en: {
    back: "← This enrollment's certificates",
    title: 'Performance notes',
    empty: 'No notes about this student yet.',
    delete: 'Delete',
    placeholder: 'E.g. Their participation improved a lot in recent classes.',
    submit: 'Add note',
  },
};

interface StudentNote {
  id: string;
  body: string;
  createdAt: string;
  author: { fullName: string };
}

export default async function AnotacionesDeMatriculaPage({
  params,
  searchParams,
}: {
  params: Promise<{ enrollmentId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { enrollmentId } = await params;
  const { error } = await searchParams;
  const token = await requireAccessToken();
  const locale = await getLocale();
  const t = TEXT[locale];

  let notes: StudentNote[];
  try {
    notes = await apiFetch<StudentNote[]>(token, `/enrollments/${enrollmentId}/notes`);
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  const permissions = await getPermissions(token);
  const canCreate = can(permissions, 'student_note', 'create');
  const canDelete = can(permissions, 'student_note', 'delete');

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/matriculas/${enrollmentId}/certificados`} className="text-sm text-zinc-500 hover:underline">
        {t.back}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{t.title}</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {notes.length === 0 ? (
        <p className="mb-8 text-zinc-500">{t.empty}</p>
      ) : (
        <ul className="mb-8 divide-y divide-zinc-200 dark:divide-zinc-800">
          {notes.map((note) => (
            <li key={note.id} className="py-4">
              <p className="whitespace-pre-wrap text-sm">{note.body}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {note.author.fullName} ·{' '}
                {new Date(note.createdAt).toLocaleString(locale === 'en' ? 'en-US' : 'es-PE', { dateStyle: 'long', timeStyle: 'short' })}
              </p>
              {canDelete && (
                <form action={eliminarAnotacion.bind(null, enrollmentId, note.id)} className="mt-1">
                  <button type="submit" className="text-xs text-red-600 underline dark:text-red-400">
                    {t.delete}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {canCreate && (
        <form action={crearAnotacion.bind(null, enrollmentId)} className="flex max-w-xl flex-col gap-3">
          <textarea
            name="body"
            rows={4}
            required
            placeholder={t.placeholder}
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <Button type="submit" className="self-start">
            {t.submit}
          </Button>
        </form>
      )}
    </div>
  );
}
