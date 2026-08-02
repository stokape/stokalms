// ============================================================================
// cursos/[courseId]/modulos/page.tsx — Contenido del curso: lista de
// Módulos (el primer nivel de "Course > Module > Lesson > Resource", ver
// schema.prisma). Docente/Coordinador/Administrador pueden crear módulos;
// un Estudiante solo los ve (permiso "module:view", ver prisma/seed.js).
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { crearModulo, eliminarModulo } from './actions';

interface CourseModule {
  id: string;
  title: string;
  order: number;
}

interface Course {
  id: string;
  title: string;
}

export default async function ModulosDelCursoPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { courseId } = await params;
  const { error } = await searchParams;
  const token = await requireAccessToken();

  let course: Course;
  let modules: CourseModule[];
  try {
    [course, modules] = await Promise.all([
      apiFetch<Course>(token, `/courses/${courseId}`),
      apiFetch<CourseModule[]>(token, `/courses/${courseId}/modules`),
    ]);
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  // El formulario de crear módulo solo tiene sentido para quien puede
  // crearlos — se intenta un POST inofensivo... en realidad, más simple: se
  // pide el permiso implícitamente al intentar la acción y se atrapa el 403
  // ahí (ver actions.ts). Para no mostrar un formulario inútil a un
  // Estudiante, alcanza con NO mostrarlo si el rol no tiene "module:create"
  // — pero como el backend no expone "qué permisos tengo" por endpoint, la
  // señal más simple y ya usada en el resto de la app es intentarlo y dejar
  // que el 403 lo bloquee (mismo criterio que matricular en secciones.tsx).

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/cursos/${courseId}`} className="text-sm text-zinc-500 hover:underline">
        &larr; {course.title}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">Contenido del curso</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {modules.length === 0 ? (
        <p className="mb-8 text-zinc-500">Este curso todavía no tiene ningún módulo.</p>
      ) : (
        <ul className="mb-8 divide-y divide-zinc-200 dark:divide-zinc-800">
          {modules.map((module) => (
            <li key={module.id} className="flex items-center justify-between gap-4 py-3">
              <Link
                href={`/cursos/${courseId}/modulos/${module.id}`}
                className="hover:underline"
              >
                {module.title}
              </Link>
              <form action={eliminarModulo.bind(null, courseId, module.id)}>
                <button type="submit" className="text-xs text-red-600 underline dark:text-red-400">
                  Eliminar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-3 text-lg font-medium">Crear un módulo nuevo</h2>
      <form action={crearModulo.bind(null, courseId)} className="flex max-w-sm gap-2">
        <input
          name="title"
          type="text"
          required
          placeholder='Ej. "Módulo 1 - Introducción"'
          className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-full bg-foreground px-4 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Crear
        </button>
      </form>
    </div>
  );
}
