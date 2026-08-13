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
import { Button } from '@/components/ui/Button';
import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmitButton';
import { getLocale, type Locale } from '@/lib/locale';
import { crearLeccion, actualizarModulo, actualizarLeccionTitulo, eliminarLeccion } from './actions';

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

const ASSESSMENT_TYPE_LABELS_BY_LOCALE: Record<Locale, Record<string, string>> = {
  es: { exam: 'Examen', assignment: 'Tarea', forum: 'Foro', rubric: 'Rúbrica' },
  en: { exam: 'Exam', assignment: 'Assignment', forum: 'Forum', rubric: 'Rubric' },
};

const TEXT = {
  es: {
    backToContent: '← Contenido del curso',
    renameModule: 'Renombrar módulo',
    lessons: 'Lecciones',
    noLessons: 'Este módulo todavía no tiene ninguna lección.',
    save: 'Guardar',
    delete: 'Eliminar',
    deleteConfirm: (title: string) => `¿Eliminar la lección "${title}"? Se pierden también sus recursos. No se puede deshacer.`,
    createLesson: 'Crear una lección nueva',
    lessonPlaceholder: 'Ej. "Lección 1 - Introducción"',
    contentPlaceholder: 'Texto de la lección (opcional, se puede completar después). Los archivos y enlaces se agregan aparte, una vez creada la lección.',
    createLessonSubmit: 'Crear lección',
    assessmentsHeading: 'Tareas y evaluaciones de este módulo',
    noAssessments: 'Este módulo todavía no tiene ninguna evaluación.',
    untitled: (type: string) => `${type} sin título`,
    createAssessment: 'Crear una evaluación en este módulo',
  },
  en: {
    backToContent: '← Course content',
    renameModule: 'Rename module',
    lessons: 'Lessons',
    noLessons: "This module doesn't have any lessons yet.",
    save: 'Save',
    delete: 'Delete',
    deleteConfirm: (title: string) => `Delete the "${title}" lesson? Its resources are lost too. This can't be undone.`,
    createLesson: 'Create a new lesson',
    lessonPlaceholder: 'E.g. "Lesson 1 - Introduction"',
    contentPlaceholder: 'Lesson text (optional, can be filled in later). Files and links are added separately, once the lesson is created.',
    createLessonSubmit: 'Create lesson',
    assessmentsHeading: 'Assignments and assessments for this module',
    noAssessments: "This module doesn't have any assessments yet.",
    untitled: (type: string) => `Untitled ${type}`,
    createAssessment: 'Create an assessment in this module',
  },
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
  const locale = await getLocale();
  const t = TEXT[locale];
  const ASSESSMENT_TYPE_LABELS = ASSESSMENT_TYPE_LABELS_BY_LOCALE[locale];

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
  const canEditModule = can(permissions, 'module', 'edit');
  const canCreateLesson = can(permissions, 'lesson', 'create');
  const canEditLesson = can(permissions, 'lesson', 'edit');
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
        {t.backToContent}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{courseModule.title}</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {canEditModule && (
        <form
          action={actualizarModulo.bind(null, courseId, moduleId)}
          className="mb-8 flex max-w-sm gap-2"
        >
          <input
            name="title"
            type="text"
            defaultValue={courseModule.title}
            required
            className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            {t.renameModule}
          </button>
        </form>
      )}

      <h2 className="mb-3 text-lg font-medium">{t.lessons}</h2>
      {lessons.length === 0 ? (
        <p className="mb-8 text-zinc-500">{t.noLessons}</p>
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
              <div className="flex items-center gap-3">
                {canEditLesson && (
                  <form
                    action={actualizarLeccionTitulo.bind(null, courseId, moduleId, lesson.id)}
                    className="flex items-center gap-1"
                  >
                    <input
                      name="title"
                      type="text"
                      defaultValue={lesson.title}
                      required
                      className="w-40 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    <button type="submit" className="text-xs underline">
                      {t.save}
                    </button>
                  </form>
                )}
                {canDeleteLesson && (
                  <form action={eliminarLeccion.bind(null, courseId, moduleId, lesson.id)}>
                    <ConfirmSubmitButton
                      className="text-xs text-red-600 underline dark:text-red-400"
                      confirmMessage={t.deleteConfirm(lesson.title)}
                    >
                      {t.delete}
                    </ConfirmSubmitButton>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canCreateLesson && (
        <>
          <h3 className="mb-3 text-base font-medium">{t.createLesson}</h3>
          <form
            action={crearLeccion.bind(null, courseId, moduleId)}
            className="mb-10 flex max-w-xl flex-col gap-3"
          >
            <input
              name="title"
              type="text"
              required
              placeholder={t.lessonPlaceholder}
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <textarea
              name="content"
              rows={6}
              placeholder={t.contentPlaceholder}
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <Button type="submit" className="self-start">
              {t.createLessonSubmit}
            </Button>
          </form>
        </>
      )}

      {moduleAssessments && (
        <>
          <h2 className="mb-3 text-lg font-medium">{t.assessmentsHeading}</h2>
          {moduleAssessments.length === 0 ? (
            <p className="mb-4 text-zinc-500">{t.noAssessments}</p>
          ) : (
            <ul className="mb-4 divide-y divide-zinc-200 dark:divide-zinc-800">
              {moduleAssessments.map((a) => (
                <li key={a.id} className="py-3">
                  <Link href={`/cursos/${courseId}/evaluaciones/${a.id}`} className="hover:underline">
                    {a.config.title || t.untitled(ASSESSMENT_TYPE_LABELS[a.type] ?? a.type)}
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
              {t.createAssessment}
            </Link>
          )}
        </>
      )}
    </div>
  );
}
