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
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';

interface StudentResult {
  enrollmentId: string;
  student: { userId: string; email: string; fullName: string };
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
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const token = await requireAccessToken();

  let data: GradesResponse;
  try {
    data = await apiFetch<GradesResponse>(token, `/courses/${courseId}/grades`);
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/cursos/${courseId}`} className="text-sm text-zinc-500 hover:underline">
        &larr; Curso
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">Notas finales</h1>

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
        <p className="text-zinc-500">
          Todavía no hay notas publicadas para este curso (ver "Publicar notas" en el panel del
          docente, o pídele al docente que publique).
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="py-2">Estudiante</th>
              <th className="py-2">Nota final</th>
              <th className="py-2">Letra</th>
            </tr>
          </thead>
          <tbody>
            {data.results.map((r) => (
              <tr key={r.enrollmentId} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2">{r.student.fullName}</td>
                <td className="py-2 font-medium">{r.finalScore}</td>
                <td className="py-2">{r.letterGrade ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
