// ============================================================================
// notas/page.tsx — "Notas" como sección propia del menú principal, en vez
// de quedar escondida como un enlace suelto dentro del detalle de cada
// curso (donde había que entrar primero a "Cursos" para encontrarla).
//
// Muestra DOS listas posibles, cada una en su propio try/catch (mismo
// criterio que el resto de la app: un permiso que falta no debe romper la
// sección que sí corresponde a este rol):
//   - "Todos los cursos" (GET /courses): para quien administra notas
//     (Docente/Coordinador/Administrador, permiso "grade:view").
//   - "Tus cursos" (GET /enrollments/mine): autoservicio para un Estudiante,
//     sin necesitar ningún permiso administrativo.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';

interface Course {
  id: string;
  code: string;
  title: string;
}

interface EnrollmentMine {
  id: string;
  course: { id: string; code: string; title: string };
  section: { id: string; name: string };
}

export default async function NotasPage() {
  const token = await requireAccessToken();

  let allCourses: Course[] | null = null;
  try {
    allCourses = await apiFetch<Course[]>(token, '/courses');
  } catch {
    allCourses = null;
  }

  let myEnrollments: EnrollmentMine[] | null = null;
  try {
    myEnrollments = await apiFetch<EnrollmentMine[]>(token, '/enrollments/mine');
  } catch {
    myEnrollments = null;
  }

  if (!allCourses && !myEnrollments) {
    return <ErrorBanner message={toErrorMessage(new Error())} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold">Notas</h1>

      {allCourses && (
        <>
          <h2 className="mb-3 text-lg font-medium">Notas por curso</h2>
          {allCourses.length === 0 ? (
            <p className="mb-8 text-zinc-500">Todavía no hay ningún curso creado.</p>
          ) : (
            <ul className="mb-8 divide-y divide-zinc-200 dark:divide-zinc-800">
              {allCourses.map((c) => (
                <li key={c.id} className="py-3">
                  <Link href={`/cursos/${c.id}/notas`} className="hover:underline">
                    {c.title} <span className="text-sm text-zinc-500">({c.code})</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {myEnrollments && (
        <>
          <h2 className="mb-3 text-lg font-medium">Tus notas</h2>
          {myEnrollments.length === 0 ? (
            <p className="text-zinc-500">Todavía no estás matriculado en ningún curso.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {myEnrollments.map((e) => (
                <li key={e.id} className="py-3">
                  <Link href={`/cursos/${e.course.id}/notas`} className="hover:underline">
                    {e.course.title}{' '}
                    <span className="text-sm text-zinc-500">
                      ({e.course.code} · {e.section.name})
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
