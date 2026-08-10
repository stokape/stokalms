// ============================================================================
// matriculas/[enrollmentId]/avance/page.tsx — "Avance" de una matrícula:
// lecciones vistas, evaluaciones rendidas, asistencia y nota parcial (ver
// apps/api/.../academic-progress/). Vista de SOLO LECTURA, pensada para
// Coordinador académico (permiso "student_progress:view").
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { getLocale } from '@/lib/locale';

const TEXT = {
  es: {
    title: 'Avance del alumno',
    lessonsViewed: 'Lecciones vistas',
    evaluationsTaken: 'Evaluaciones rendidas',
    attendance: 'Asistencia',
    noRecords: 'Todavía no hay registros',
    partialGrade: 'Nota parcial',
    notAvailable: 'No disponible (falta escala de notas o calificaciones)',
  },
  en: {
    title: "Student's progress",
    lessonsViewed: 'Lessons viewed',
    evaluationsTaken: 'Assessments taken',
    attendance: 'Attendance',
    noRecords: 'No records yet',
    partialGrade: 'Partial grade',
    notAvailable: 'Not available (missing grading scale or grades)',
  },
};

interface Progress {
  course: { id: string; title: string };
  lessons: { viewed: number; total: number };
  evaluations: { submitted: number; total: number };
  attendance: { present: number; total: number; percentage: number } | null;
  partialGrade: { finalScore: number; letterGrade: string | null } | null;
}

function porcentaje(parte: number, total: number): number {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

export default async function AvanceDeMatriculaPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];

  let progress: Progress;
  try {
    progress = await apiFetch<Progress>(token, `/enrollments/${enrollmentId}/progress`);
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/cursos/${progress.course.id}`} className="text-sm text-zinc-500 hover:underline">
        &larr; {progress.course.title}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{t.title}</h1>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <dt className="text-xs text-zinc-500">{t.lessonsViewed}</dt>
          <dd className="text-lg font-medium">
            {progress.lessons.viewed} / {progress.lessons.total}{' '}
            <span className="text-sm font-normal text-zinc-500">
              ({porcentaje(progress.lessons.viewed, progress.lessons.total)}%)
            </span>
          </dd>
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <dt className="text-xs text-zinc-500">{t.evaluationsTaken}</dt>
          <dd className="text-lg font-medium">
            {progress.evaluations.submitted} / {progress.evaluations.total}{' '}
            <span className="text-sm font-normal text-zinc-500">
              ({porcentaje(progress.evaluations.submitted, progress.evaluations.total)}%)
            </span>
          </dd>
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <dt className="text-xs text-zinc-500">{t.attendance}</dt>
          <dd className="text-lg font-medium">
            {progress.attendance ? (
              <>
                {progress.attendance.present} / {progress.attendance.total}{' '}
                <span className="text-sm font-normal text-zinc-500">
                  ({progress.attendance.percentage}%)
                </span>
              </>
            ) : (
              <span className="text-sm font-normal text-zinc-500">{t.noRecords}</span>
            )}
          </dd>
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <dt className="text-xs text-zinc-500">{t.partialGrade}</dt>
          <dd className="text-lg font-medium">
            {progress.partialGrade ? (
              <>
                {progress.partialGrade.finalScore}
                {progress.partialGrade.letterGrade && ` (${progress.partialGrade.letterGrade})`}
              </>
            ) : (
              <span className="text-sm font-normal text-zinc-500">{t.notAvailable}</span>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
