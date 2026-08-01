// ============================================================================
// cursos/[courseId]/page.tsx — Detalle de un curso: sus secciones (para
// entrar a matricular/ver estudiantes) y un enlace a la nota final.
//
// "[courseId]" en el nombre de la carpeta es un segmento DINAMICO de
// Next.js: captura lo que venga en esa parte de la URL (ej. "/cursos/abc-123")
// y lo entrega en "params.courseId".
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';

interface Course {
  id: string;
  code: string;
  title: string;
}

interface Section {
  id: string;
  name: string;
  capacity: number;
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const token = await requireAccessToken();

  let course: Course;
  let sections: Section[];
  try {
    course = await apiFetch<Course>(token, `/courses/${courseId}`);
    sections = await apiFetch<Section[]>(token, `/courses/${courseId}/sections`);
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/cursos" className="text-sm text-zinc-500 hover:underline">
        &larr; Cursos
      </Link>
      <h1 className="mt-2 mb-1 text-2xl font-semibold">{course.title}</h1>
      <p className="mb-6 font-mono text-sm text-zinc-500">{course.code}</p>

      <div className="mb-8">
        <Link
          href={`/cursos/${courseId}/notas`}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Ver notas finales del curso
        </Link>
      </div>

      <h2 className="mb-3 text-lg font-medium">Secciones</h2>
      {sections.length === 0 ? (
        <p className="text-zinc-500">Este curso todavía no tiene secciones.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {sections.map((section) => (
            <li key={section.id} className="py-3">
              <Link href={`/cursos/${courseId}/secciones/${section.id}`} className="hover:underline">
                {section.name}{' '}
                <span className="text-sm text-zinc-500">
                  (cupo: {section.capacity > 0 ? section.capacity : 'sin límite'})
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
