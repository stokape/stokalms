// ============================================================================
// cursos/page.tsx — "GET /cursos": lista todos los cursos del tenant
// activo. Punto de entrada natural para Docentes/Coordinadores (para
// navegar a una seccion y matricular/calificar); un Estudiante tambien
// puede verla (course:view lo tienen todos los roles), aunque su punto de
// entrada mas directo es "Mis matriculas" (ver ../mis-matriculas/page.tsx).
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';

interface Course {
  id: string;
  code: string;
  title: string;
}

export default async function CursosPage() {
  const token = await requireAccessToken();

  let courses: Course[];
  try {
    courses = await apiFetch<Course[]>(token, '/courses');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold">Cursos</h1>

      {courses.length === 0 ? (
        <p className="text-zinc-500">Todavía no hay cursos registrados en esta institución.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {courses.map((course) => (
            <li key={course.id} className="py-3">
              <Link href={`/cursos/${course.id}`} className="hover:underline">
                <span className="font-mono text-sm text-zinc-500">{course.code}</span>{' '}
                <span className="font-medium">{course.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
