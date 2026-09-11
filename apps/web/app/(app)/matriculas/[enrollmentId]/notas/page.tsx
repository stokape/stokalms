// ============================================================================
// matriculas/[enrollmentId]/notas/page.tsx — Anotaciones de desempeño que un
// Docente deja sobre un alumno puntual (ver apps/api/.../student-notes/).
// A diferencia de una nota (Grade), esto no mide nada: es texto libre de
// seguimiento cualitativo ("mejoro su participacion", "no entrego la tarea 3").
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage, getPermissions, can } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { getLocale } from '@/lib/locale';
import { EliminarAnotacionButton, CrearAnotacionForm } from './AnotacionForms';

const TEXT = {
  es: {
    back: '← Certificados de esta matrícula',
    title: 'Anotaciones de desempeño',
    empty: 'Todavía no hay ninguna anotación sobre este alumno.',
    delete: 'Eliminar',
    deleteConfirm: '¿Eliminar esta anotación? No se puede deshacer.',
    placeholder: 'Ej. Mejoró mucho su participación en las últimas clases.',
    submit: 'Agregar anotación',
    submitting: 'Agregando…',
  },
  en: {
    back: "← This enrollment's certificates",
    title: 'Performance notes',
    empty: 'No notes about this student yet.',
    delete: 'Delete',
    deleteConfirm: "Delete this note? This can't be undone.",
    placeholder: 'E.g. Their participation improved a lot in recent classes.',
    submit: 'Add note',
    submitting: 'Adding…',
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
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
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
                <EliminarAnotacionButton
                  enrollmentId={enrollmentId}
                  noteId={note.id}
                  confirmMessage={t.deleteConfirm}
                  label={t.delete}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {canCreate && (
        <CrearAnotacionForm
          enrollmentId={enrollmentId}
          placeholder={t.placeholder}
          submitLabel={t.submit}
          submittingLabel={t.submitting}
        />
      )}
    </div>
  );
}
