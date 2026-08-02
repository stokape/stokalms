// ============================================================================
// cursos/[courseId]/modulos/[moduleId]/page.tsx — Lecciones dentro de un
// Módulo (segundo nivel de contenido: Module > Lesson > Resource).
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { crearLeccion, eliminarLeccion } from './actions';

interface CourseModule {
  id: string;
  title: string;
}

interface Lesson {
  id: string;
  title: string;
}

export default async function LeccionesDelModuloPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; moduleId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { courseId, moduleId } = await params;
  const { error } = await searchParams;
  const token = await requireAccessToken();

  let courseModule: CourseModule;
  let lessons: Lesson[];
  try {
    [courseModule, lessons] = await Promise.all([
      apiFetch<CourseModule>(token, `/courses/${courseId}/modules/${moduleId}`),
      apiFetch<Lesson[]>(token, `/courses/${courseId}/modules/${moduleId}/lessons`),
    ]);
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/cursos/${courseId}/modulos`} className="text-sm text-zinc-500 hover:underline">
        &larr; Contenido del curso
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{courseModule.title}</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {lessons.length === 0 ? (
        <p className="mb-8 text-zinc-500">Este módulo todavía no tiene ninguna lección.</p>
      ) : (
        <ul className="mb-8 divide-y divide-zinc-200 dark:divide-zinc-800">
          {lessons.map((lesson) => (
            <li key={lesson.id} className="flex items-center justify-between gap-4 py-3">
              <Link
                href={`/cursos/${courseId}/modulos/${moduleId}/${lesson.id}`}
                className="hover:underline"
              >
                {lesson.title}
              </Link>
              <form action={eliminarLeccion.bind(null, courseId, moduleId, lesson.id)}>
                <button type="submit" className="text-xs text-red-600 underline dark:text-red-400">
                  Eliminar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-3 text-lg font-medium">Crear una lección nueva</h2>
      <form
        action={crearLeccion.bind(null, courseId, moduleId)}
        className="flex max-w-xl flex-col gap-3"
      >
        <input
          name="title"
          type="text"
          required
          placeholder='Ej. "Lección 1 - Introducción"'
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <textarea
          name="content"
          rows={6}
          placeholder="Texto de la lección (opcional, se puede completar después). Los archivos y enlaces se agregan aparte, una vez creada la lección."
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="self-start rounded-full bg-foreground px-4 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Crear lección
        </button>
      </form>
    </div>
  );
}
