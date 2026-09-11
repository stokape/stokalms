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
import { getLocale, type Locale } from '@/lib/locale';
import {
  RenombrarModuloForm,
  ActualizarLeccionTituloForm,
  EliminarLeccionButton,
  CrearLeccionForm,
} from './LeccionForms';

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
    renamingModule: 'Renombrando…',
    lessons: 'Lecciones',
    noLessons: 'Este módulo todavía no tiene ninguna lección.',
    save: 'Guardar',
    saving: 'Guardando…',
    delete: 'Eliminar',
    deleteConfirm: (title: string) => `¿Eliminar la lección "${title}"? Se pierden también sus recursos. No se puede deshacer.`,
    createLesson: 'Crear una lección nueva',
    lessonPlaceholder: 'Ej. "Lección 1 - Introducción"',
    contentPlaceholder: 'Texto de la lección (opcional, se puede completar después). Los archivos y enlaces se agregan aparte, una vez creada la lección.',
    createLessonSubmit: 'Crear lección',
    creatingLesson: 'Creando…',
    assessmentsHeading: 'Tareas y evaluaciones de este módulo',
    noAssessments: 'Este módulo todavía no tiene ninguna evaluación.',
    untitled: (type: string) => `${type} sin título`,
    createAssessment: 'Crear una evaluación en este módulo',
  },
  en: {
    backToContent: '← Course content',
    renameModule: 'Rename module',
    renamingModule: 'Renaming…',
    lessons: 'Lessons',
    noLessons: "This module doesn't have any lessons yet.",
    save: 'Save',
    saving: 'Saving…',
    delete: 'Delete',
    deleteConfirm: (title: string) => `Delete the "${title}" lesson? Its resources are lost too. This can't be undone.`,
    createLesson: 'Create a new lesson',
    lessonPlaceholder: 'E.g. "Lesson 1 - Introduction"',
    contentPlaceholder: 'Lesson text (optional, can be filled in later). Files and links are added separately, once the lesson is created.',
    createLessonSubmit: 'Create lesson',
    creatingLesson: 'Creating…',
    assessmentsHeading: 'Assignments and assessments for this module',
    noAssessments: "This module doesn't have any assessments yet.",
    untitled: (type: string) => `Untitled ${type}`,
    createAssessment: 'Create an assessment in this module',
  },
};

export default async function LeccionesDelModuloPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string }>;
}) {
  const { courseId, moduleId } = await params;
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

      {canEditModule && (
        <RenombrarModuloForm
          courseId={courseId}
          moduleId={moduleId}
          title={courseModule.title}
          submitLabel={t.renameModule}
          submittingLabel={t.renamingModule}
        />
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
                  <ActualizarLeccionTituloForm
                    courseId={courseId}
                    moduleId={moduleId}
                    lessonId={lesson.id}
                    title={lesson.title}
                    saveLabel={t.save}
                    savingLabel={t.saving}
                  />
                )}
                {canDeleteLesson && (
                  <EliminarLeccionButton
                    courseId={courseId}
                    moduleId={moduleId}
                    lessonId={lesson.id}
                    confirmMessage={t.deleteConfirm(lesson.title)}
                    label={t.delete}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canCreateLesson && (
        <>
          <h3 className="mb-3 text-base font-medium">{t.createLesson}</h3>
          <CrearLeccionForm
            courseId={courseId}
            moduleId={moduleId}
            titlePlaceholder={t.lessonPlaceholder}
            contentPlaceholder={t.contentPlaceholder}
            submitLabel={t.createLessonSubmit}
            submittingLabel={t.creatingLesson}
          />
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
