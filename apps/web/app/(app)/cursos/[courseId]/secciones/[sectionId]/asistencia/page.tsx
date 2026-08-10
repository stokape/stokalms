// ============================================================================
// secciones/[sectionId]/asistencia/page.tsx — Tomar asistencia de una
// sección para una fecha puntual. Un solo envío marca a TODOS los alumnos
// de la sección de una vez (ver actions.ts, marcarAsistencia) — volver a
// enviar la misma fecha corrige lo ya marcado en vez de duplicarlo (ver
// apps/api/.../attendance.service.ts, "mark").
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Button } from '@/components/ui/Button';
import { getLocale, type Locale } from '@/lib/locale';
import { marcarAsistencia } from './actions';

interface RosterRow {
  enrollmentId: string;
  student: { fullName: string; email: string };
  status: 'present' | 'absent' | 'late' | 'excused' | null;
}

const STATUS_OPTIONS_BY_LOCALE: Record<Locale, Array<{ value: string; label: string }>> = {
  es: [
    { value: 'present', label: 'Presente' },
    { value: 'absent', label: 'Ausente' },
    { value: 'late', label: 'Tarde' },
    { value: 'excused', label: 'Justificado' },
  ],
  en: [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'excused', label: 'Excused' },
  ],
};

const TEXT = {
  es: {
    back: '← Sección',
    title: 'Asistencia',
    saved: 'Asistencia guardada.',
    date: 'Fecha',
    view: 'Ver',
    noStudents: 'Esta sección todavía no tiene alumnos activos matriculados.',
    student: 'Estudiante',
    status: 'Estado',
    submit: 'Guardar asistencia',
  },
  en: {
    back: '← Section',
    title: 'Attendance',
    saved: 'Attendance saved.',
    date: 'Date',
    view: 'View',
    noStudents: "This section doesn't have any active enrolled students yet.",
    student: 'Student',
    status: 'Status',
    submit: 'Save attendance',
  },
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function AsistenciaPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; sectionId: string }>;
  searchParams: Promise<{ date?: string; error?: string; ok?: string }>;
}) {
  const { courseId, sectionId } = await params;
  const { date, error, ok } = await searchParams;
  const sessionDate = date || today();
  const token = await requireAccessToken();
  const locale = await getLocale();
  const t = TEXT[locale];
  const STATUS_OPTIONS = STATUS_OPTIONS_BY_LOCALE[locale];

  let roster: RosterRow[];
  try {
    roster = await apiFetch<RosterRow[]>(
      token,
      `/courses/${courseId}/sections/${sectionId}/attendance?date=${sessionDate}`,
    );
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/cursos/${courseId}/secciones/${sectionId}`}
        className="text-sm text-zinc-500 hover:underline"
      >
        {t.back}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{t.title}</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}
      {ok && (
        <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          {t.saved}
        </div>
      )}

      <form method="get" className="mb-6 flex items-center gap-2">
        <label className="text-sm text-zinc-500" htmlFor="date">
          {t.date}:
        </label>
        <input
          id="date"
          name="date"
          type="date"
          defaultValue={sessionDate}
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          {t.view}
        </button>
      </form>

      {roster.length === 0 ? (
        <p className="text-zinc-500">{t.noStudents}</p>
      ) : (
        <form action={marcarAsistencia.bind(null, courseId, sectionId)}>
          <input type="hidden" name="sessionDate" value={sessionDate} />
          <table className="mb-6 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-2">{t.student}</th>
                <th className="py-2">{t.status}</th>
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
                      {STATUS_OPTIONS.map((opt) => (
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
          <Button type="submit">{t.submit}</Button>
        </form>
      )}
    </div>
  );
}
