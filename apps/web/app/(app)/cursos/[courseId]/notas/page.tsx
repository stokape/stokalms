// ============================================================================
// cursos/[courseId]/notas/page.tsx — Notas finales del curso.
//
// La MISMA pagina sirve para dos roles distintos sin ninguna logica extra
// aqui: GradebookService.getGrades (backend) ya decide, segun el permiso de
// quien pregunta, si la respuesta trae la tabla COMPLETA (Coordinador/
// Docente, permiso "grade:view") o solo la fila de esa persona (Estudiante,
// permiso "grade:view_own") — ver el comentario extenso en
// apps/api/src/modules/gradebook/gradebook.service.ts.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage, ApiError } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { getLocale } from '@/lib/locale';

const TEXT = {
  es: {
    course: '← Curso',
    noScale: 'Este curso todavía no tiene una escala de notas asignada, así que no se puede calcular ninguna nota final todavía.',
    backToAssign: 'Vuelve al curso para asignarle una',
    title: 'Notas finales',
    noGrades: 'Todavía no hay notas publicadas para este curso (ver "Publicar notas" en el panel del docente, o pídele al docente que publique).',
    section: 'Sección',
    all: 'Todas',
    filter: 'Filtrar',
    student: 'Estudiante',
    finalGrade: 'Nota final',
    letter: 'Letra',
  },
  en: {
    course: '← Course',
    noScale: "This course doesn't have a grading scale assigned yet, so no final grade can be calculated yet.",
    backToAssign: 'Go back to the course to assign one',
    title: 'Final grades',
    noGrades: 'No grades have been published for this course yet (see "Publish grades" in the teacher\'s panel, or ask the teacher to publish them).',
    section: 'Section',
    all: 'All',
    filter: 'Filter',
    student: 'Student',
    finalGrade: 'Final grade',
    letter: 'Letter',
  },
};

interface StudentResult {
  enrollmentId: string;
  student: { userId: string; email: string; fullName: string };
  section: { id: string; name: string };
  finalScore: number;
  letterGrade: string | null;
}

interface GradesResponse {
  courseId: string;
  results: StudentResult[];
  warnings: string[];
}

export default async function CourseGradesPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ sectionId?: string }>;
}) {
  const { courseId } = await params;
  const { sectionId } = await searchParams;
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];

  let data: GradesResponse;
  try {
    data = await apiFetch<GradesResponse>(token, `/courses/${courseId}/grades`);
  } catch (err) {
    // El backend devuelve un 409 especificamente cuando el curso todavia
    // no tiene una escala de notas asignada (ver
    // GradebookService.computeCourseGrades) — ese mensaje esta escrito
    // para quien programa ("...PATCH /courses/:id...", ver
    // gradebook.service.ts), no para quien usa la plataforma. Se detecto
    // probando de verdad: un usuario real lo vio tal cual, sin entender
    // que significaba ni que hacer. Aquí se reemplaza por un mensaje en
    // lenguaje simple con un enlace a donde SI se puede solucionar (ver
    // el formulario de "asignar escala" en cursos/[courseId]/page.tsx).
    if (err instanceof ApiError && err.status === 409) {
      return (
        <div className="mx-auto max-w-3xl">
          <Link href={`/cursos/${courseId}`} className="text-sm text-zinc-500 hover:underline">
            {t.course}
          </Link>
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {t.noScale}{' '}
            <Link href={`/cursos/${courseId}`} className="underline">
              {t.backToAssign}
            </Link>
            .
          </p>
        </div>
      );
    }
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  // Filtro de sección: se hace del lado del cliente sobre lo que ya
  // devolvió /courses/:courseId/grades (que trae TODAS las secciones del
  // curso juntas) — no hace falta un query param nuevo en el backend para
  // esto, ya que el volumen de un curso es chico.
  const sections = Array.from(
    new Map(data.results.map((r) => [r.section.id, r.section])).values(),
  );
  const filteredResults = sectionId
    ? data.results.filter((r) => r.section.id === sectionId)
    : data.results;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/cursos/${courseId}`} className="text-sm text-zinc-500 hover:underline">
        {t.course}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{t.title}</h1>

      {data.warnings.length > 0 && (
        <div className="mb-6 space-y-2">
          {data.warnings.map((w, i) => (
            <p
              key={i}
              className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            >
              {w}
            </p>
          ))}
        </div>
      )}

      {data.results.length === 0 ? (
        <p className="text-zinc-500">{t.noGrades}</p>
      ) : (
        <>
          {sections.length > 1 && (
            <form method="get" className="mb-4 flex items-center gap-2">
              <label className="text-sm text-zinc-500" htmlFor="sectionId">
                {t.section}:
              </label>
              <select
                id="sectionId"
                name="sectionId"
                defaultValue={sectionId ?? ''}
                className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">{t.all}</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                {t.filter}
              </button>
            </form>
          )}
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="py-2">{t.student}</th>
              <th className="py-2">{t.section}</th>
              <th className="py-2">{t.finalGrade}</th>
              <th className="py-2">{t.letter}</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((r) => (
              <tr key={r.enrollmentId} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2">{r.student.fullName}</td>
                <td className="py-2">{r.section.name}</td>
                <td className="py-2 font-medium">{r.finalScore}</td>
                <td className="py-2">{r.letterGrade ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        </>
      )}
    </div>
  );
}
