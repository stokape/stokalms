// ============================================================================
// secciones/[sectionId]/asistencia/page.tsx — Tomar asistencia de una
// sección para una fecha puntual. Un solo envío marca a TODOS los alumnos
// de la sección de una vez (ver actions.ts, marcarAsistencia) — volver a
// enviar la misma fecha corrige lo ya marcado en vez de duplicarlo (ver
// apps/api/.../attendance.service.ts, "mark").
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getLocale, type Locale } from '@/lib/locale';
import { AsistenciaForm } from './AsistenciaForm';

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
    back: 'Sección',
    coursesBreadcrumb: 'Cursos',
    title: 'Asistencia',
    saved: 'Asistencia guardada.',
    date: 'Fecha',
    view: 'Ver',
    noStudents: 'Esta sección todavía no tiene alumnos activos matriculados.',
    student: 'Estudiante',
    status: 'Estado',
    submit: 'Guardar asistencia',
    submitting: 'Guardando…',
  },
  en: {
    back: 'Section',
    coursesBreadcrumb: 'Courses',
    title: 'Attendance',
    saved: 'Attendance saved.',
    date: 'Date',
    view: 'View',
    noStudents: "This section doesn't have any active enrolled students yet.",
    student: 'Student',
    status: 'Status',
    submit: 'Save attendance',
    submitting: 'Saving…',
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
  searchParams: Promise<{ date?: string }>;
}) {
  const { courseId, sectionId } = await params;
  const { date } = await searchParams;
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

  // Solo para el breadcrumb — best-effort, ver la misma nota en
  // modulos/[moduleId]/[lessonId]/page.tsx.
  let courseTitle = '';
  let sectionName = '';
  try {
    const [course, section] = await Promise.all([
      apiFetch<{ title: string }>(token, `/courses/${courseId}`),
      apiFetch<{ name: string }>(token, `/courses/${courseId}/sections/${sectionId}`),
    ]);
    courseTitle = course.title;
    sectionName = section.name;
  } catch {
    // Intencionalmente silencioso.
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs
        items={[
          { label: t.coursesBreadcrumb, href: '/cursos' },
          { label: courseTitle || courseId, href: `/cursos/${courseId}` },
          { label: sectionName || t.back, href: `/cursos/${courseId}/secciones/${sectionId}` },
          { label: t.title },
        ]}
      />
      <h1 className="mt-1 mb-6 text-2xl font-semibold">{t.title}</h1>

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
        <AsistenciaForm
          courseId={courseId}
          sectionId={sectionId}
          sessionDate={sessionDate}
          roster={roster}
          statusOptions={STATUS_OPTIONS}
          studentLabel={t.student}
          statusLabel={t.status}
          submitLabel={t.submit}
          submittingLabel={t.submitting}
          savedLabel={t.saved}
        />
      )}
    </div>
  );
}
