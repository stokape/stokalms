// ============================================================================
// cursos/[courseId]/modulos/[moduleId]/page.tsx — Contenido de UN Módulo:
// sus Lecciones (Module > Lesson > Resource) Y sus Evaluaciones — un módulo
// agrupa "clases" (lecciones) además de "tareas y evaluaciones", todo
// organizado dentro del mismo curso (ver schema.prisma, Assessment.moduleId,
// campo opcional agregado para poder anidar una evaluación en un módulo
// concreto en vez de dejarla solo "suelta" a nivel de curso).
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage, getCoursePermissions, can } from '@/lib/api';
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

interface Assessment {
  id: string;
  type: string;
  maxPoints: number;
  moduleId: string | null;
  config: { title?: string };
}

const ASSESSMENT_TYPE_LABELS: Record<string, string> = {
  exam: 'Examen',
  assignment: 'Tarea',
  forum: 'Foro',
  rubric: 'Rúbrica',
};

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

  const permissions = await getCoursePermissions(token, courseId);
  const canCreateLesson = can(permissions, 'lesson', 'create');
  const canDeleteLesson = can(permissions, 'lesson', 'delete');
  const canCreateAssessment = can(permissions, 'assessment', 'create');

  // Las evaluaciones del MODULO son un subconjunto de las del curso (no hay
  // un endpoint aparte "por modulo") — Coordinador académico no tiene
  // "assessment:view" (ver prisma/seed.js), asi que esto se pide en un
  // try/catch separado: si falla, simplemente no se muestra la seccion,
  // sin romper el resto de la pagina (mismo criterio que las secciones del
  // curso en cursos/[courseId]/page.tsx).
  let moduleAssessments: Assessment[] | null = null;
  try {
    const all = await apiFetch<Assessment[]>(token, `/courses/${courseId}/assessments`);
    moduleAssessments = all.filter((a) => a.moduleId === moduleId);
  } catch {
    moduleAssessments = null;
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

      <h2 className="mb-3 text-lg font-medium">Lecciones</h2>
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
              {canDeleteLesson && (
                <form action={eliminarLeccion.bind(null, courseId, moduleId, lesson.id)}>
                  <button type="submit" className="text-xs text-red-600 underline dark:text-red-400">
                    Eliminar
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {canCreateLesson && (
        <>
          <h3 className="mb-3 text-base font-medium">Crear una lección nueva</h3>
          <form
            action={crearLeccion.bind(null, courseId, moduleId)}
            className="mb-10 flex max-w-xl flex-col gap-3"
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
        </>
      )}

      {moduleAssessments && (
        <>
          <h2 className="mb-3 text-lg font-medium">Tareas y evaluaciones de este módulo</h2>
          {moduleAssessments.length === 0 ? (
            <p className="mb-4 text-zinc-500">Este módulo todavía no tiene ninguna evaluación.</p>
          ) : (
            <ul className="mb-4 divide-y divide-zinc-200 dark:divide-zinc-800">
              {moduleAssessments.map((a) => (
                <li key={a.id} className="py-3">
                  <Link href={`/cursos/${courseId}/evaluaciones/${a.id}`} className="hover:underline">
                    {a.config.title || `${ASSESSMENT_TYPE_LABELS[a.type] ?? a.type} sin título`}
                    <span className="ml-2 text-sm text-zinc-500">
                      ({ASSESSMENT_TYPE_LABELS[a.type] ?? a.type} · {a.maxPoints} pts)
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {canCreateAssessment && (
            <Link
              href={`/cursos/${courseId}/evaluaciones?moduleId=${moduleId}`}
              className="text-sm underline"
            >
              Crear una evaluación en este módulo
            </Link>
          )}
        </>
      )}
    </div>
  );
}
