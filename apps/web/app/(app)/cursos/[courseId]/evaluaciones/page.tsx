// ============================================================================
// cursos/[courseId]/evaluaciones/page.tsx — Lista de Evaluaciones de un
// curso (examenes, tareas, foros, rubricas — ver schema.prisma, modelo
// Assessment) y el formulario para crear una nueva.
//
// Assessment NO tiene un campo "titulo" propio en el modelo (solo type,
// categoria, puntaje, intentos) — se usa el JSON libre "config.title" como
// convencion de UI para poder mostrar un nombre legible sin necesitar una
// migracion de base de datos (ver actions.ts, crearEvaluacion).
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage, getCoursePermissions, can } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { getLocale, type Locale } from '@/lib/locale';
import { EliminarEvaluacionButton, CrearCategoriaForm, CrearEvaluacionForm } from './EvaluacionForms';

interface Course {
  id: string;
  title: string;
}

interface Assessment {
  id: string;
  type: string;
  maxPoints: number;
  maxAttempts: number;
  config: { title?: string };
}

interface GradebookCategory {
  id: string;
  name: string;
}

interface CourseModule {
  id: string;
  title: string;
}

const TYPE_LABELS_BY_LOCALE: Record<Locale, Record<string, string>> = {
  es: { exam: 'Examen', assignment: 'Tarea', forum: 'Foro', rubric: 'Rúbrica' },
  en: { exam: 'Exam', assignment: 'Assignment', forum: 'Forum', rubric: 'Rubric' },
};

const TEXT = {
  es: {
    title: 'Evaluaciones',
    empty: 'Este curso todavía no tiene ninguna evaluación.',
    untitled: (type: string) => `${type} sin título`,
    attempt: 'intento',
    attempts: 'intentos',
    delete: 'Eliminar',
    deleteConfirm: '¿Eliminar esta evaluación? Se pierden también sus preguntas y entregas. No se puede deshacer.',
    firstCreateCategory: 'Primero crea una categoría de notas',
    categoryHelp: 'Toda evaluación pertenece a una categoría (ej. "Exámenes", "Tareas"), que define cuánto pesa en la nota final del curso.',
    categoryNamePlaceholder: 'Ej. "Exámenes"',
    weightPlaceholder: 'Peso % (ej. 40)',
    dropLowestTitle: 'Cuántas notas bajas se descartan al promediar',
    createCategory: 'Crear categoría',
    creatingCategory: 'Creando…',
    createAssessmentHeading: 'Crear una evaluación nueva',
    assessmentTitlePlaceholder: 'Título (opcional, ej. "Examen parcial 1")',
    noModule: 'Sin módulo (queda a nivel del curso)',
    maxPointsPlaceholder: 'Puntaje máximo',
    maxAttemptsTitle: 'Intentos permitidos',
    autoPublish: 'Publicar la nota apenas se corrige (sin esperar a "publicar notas" del curso)',
    createAssessment: 'Crear evaluación',
    creatingAssessment: 'Creando…',
  },
  en: {
    title: 'Assessments',
    empty: "This course doesn't have any assessments yet.",
    untitled: (type: string) => `Untitled ${type}`,
    attempt: 'attempt',
    attempts: 'attempts',
    delete: 'Delete',
    deleteConfirm: "Delete this assessment? Its questions and submissions are lost too. This can't be undone.",
    firstCreateCategory: 'First create a grading category',
    categoryHelp: 'Every assessment belongs to a category (e.g. "Exams", "Assignments"), which defines how much it weighs in the course\'s final grade.',
    categoryNamePlaceholder: 'E.g. "Exams"',
    weightPlaceholder: 'Weight % (e.g. 40)',
    dropLowestTitle: 'How many low grades are dropped when averaging',
    createCategory: 'Create category',
    creatingCategory: 'Creating…',
    createAssessmentHeading: 'Create a new assessment',
    assessmentTitlePlaceholder: 'Title (optional, e.g. "Midterm exam")',
    noModule: "No module (stays at the course level)",
    maxPointsPlaceholder: 'Maximum points',
    maxAttemptsTitle: 'Allowed attempts',
    autoPublish: 'Publish the grade as soon as it\'s graded (without waiting for the course to "publish grades")',
    createAssessment: 'Create assessment',
    creatingAssessment: 'Creating…',
  },
};

export default async function EvaluacionesDelCursoPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ moduleId?: string }>;
}) {
  const { courseId } = await params;
  const { moduleId: preselectedModuleId } = await searchParams;
  const token = await requireAccessToken();
  const locale = await getLocale();
  const t = TEXT[locale];
  const TYPE_LABELS = TYPE_LABELS_BY_LOCALE[locale];

  let course: Course;
  let assessments: Assessment[];
  try {
    [course, assessments] = await Promise.all([
      apiFetch<Course>(token, `/courses/${courseId}`),
      apiFetch<Assessment[]>(token, `/courses/${courseId}/assessments`),
    ]);
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  const permissions = await getCoursePermissions(token, courseId);
  const canCreate = can(permissions, 'assessment', 'create');
  const canDelete = can(permissions, 'assessment', 'delete');

  // Las categorias (ver gradebook-category.controller.ts) son un permiso
  // aparte ("gradebook_category:view") que un Estudiante no tiene — en un
  // try/catch separado, mismo criterio que la escala de notas en
  // cursos/[courseId]/page.tsx: si falla, simplemente no se ofrece el
  // formulario de creacion (que de todas formas un Estudiante no podria usar).
  let categories: GradebookCategory[] | null = null;
  try {
    categories = await apiFetch<GradebookCategory[]>(token, `/courses/${courseId}/gradebook-categories`);
  } catch {
    categories = null;
  }

  // Modulos del curso, para poder anidar la evaluacion nueva en uno de
  // ellos (ver modulos/[moduleId]/page.tsx, que enlaza aca con
  // "?moduleId=..." para preseleccionarlo). Mismo criterio try/catch: si
  // falla, la evaluacion simplemente se crea "suelta" a nivel de curso.
  let modules: CourseModule[] | null = null;
  try {
    modules = await apiFetch<CourseModule[]>(token, `/courses/${courseId}/modules`);
  } catch {
    modules = null;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/cursos/${courseId}`} className="text-sm text-zinc-500 hover:underline">
        &larr; {course.title}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{t.title}</h1>

      {assessments.length === 0 ? (
        <p className="mb-8 text-zinc-500">{t.empty}</p>
      ) : (
        <ul className="mb-8 divide-y divide-zinc-200 dark:divide-zinc-800">
          {assessments.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4 py-3">
              <Link href={`/cursos/${courseId}/evaluaciones/${a.id}`} className="hover:underline">
                {a.config.title || t.untitled(TYPE_LABELS[a.type] ?? a.type)}
                <span className="ml-2 text-sm text-zinc-500">
                  ({TYPE_LABELS[a.type] ?? a.type} · {a.maxPoints} pts · {a.maxAttempts}{' '}
                  {a.maxAttempts === 1 ? t.attempt : t.attempts})
                </span>
              </Link>
              {canDelete && (
                <EliminarEvaluacionButton
                  courseId={courseId}
                  assessmentId={a.id}
                  confirmMessage={t.deleteConfirm}
                  label={t.delete}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {canCreate && categories && categories.length === 0 && (
        <>
          <h2 className="mb-3 text-lg font-medium">{t.firstCreateCategory}</h2>
          <p className="mb-3 text-sm text-zinc-500">{t.categoryHelp}</p>
          <CrearCategoriaForm
            courseId={courseId}
            namePlaceholder={t.categoryNamePlaceholder}
            weightPlaceholder={t.weightPlaceholder}
            dropLowestTitle={t.dropLowestTitle}
            submitLabel={t.createCategory}
            submittingLabel={t.creatingCategory}
          />
        </>
      )}

      {canCreate && categories && categories.length > 0 && (
        <>
          <h2 className="mb-3 text-lg font-medium">{t.createAssessmentHeading}</h2>
          <CrearEvaluacionForm
            courseId={courseId}
            typeLabels={TYPE_LABELS}
            categories={categories}
            modules={modules}
            preselectedModuleId={preselectedModuleId}
            titlePlaceholder={t.assessmentTitlePlaceholder}
            noModuleLabel={t.noModule}
            maxPointsPlaceholder={t.maxPointsPlaceholder}
            maxAttemptsTitle={t.maxAttemptsTitle}
            autoPublishLabel={t.autoPublish}
            submitLabel={t.createAssessment}
            submittingLabel={t.creatingAssessment}
          />
        </>
      )}
    </div>
  );
}
