// ============================================================================
// cursos/[courseId]/modulos/page.tsx — Contenido del curso: lista de
// Módulos (el primer nivel de "Course > Module > Lesson > Resource", ver
// schema.prisma). Docente y Administrador de entidad pueden crear/eliminar
// módulos; Estudiante y Coordinador académico solo los ven (permiso
// "module:view", ver prisma/seed.js) — los controles de crear/eliminar se
// ocultan segun el permiso real de cada rol (ver lib/api.ts, can()).
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage, getCoursePermissions, can } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { getLocale } from '@/lib/locale';
import { ActualizarModuloForm, EliminarModuloButton, CrearModuloForm } from './ModuloForms';

const TEXT = {
  es: {
    title: 'Contenido del curso',
    empty: 'Este curso todavía no tiene ningún módulo.',
    save: 'Guardar',
    saving: 'Guardando…',
    delete: 'Eliminar',
    deleteConfirm: (title: string) =>
      `¿Eliminar el módulo "${title}"? Se borran también todas sus lecciones y recursos. No se puede deshacer.`,
    createHeading: 'Crear un módulo nuevo',
    placeholder: 'Ej. "Módulo 1 - Introducción"',
    create: 'Crear',
    creating: 'Creando…',
  },
  en: {
    title: 'Course content',
    empty: "This course doesn't have any modules yet.",
    save: 'Save',
    saving: 'Saving…',
    delete: 'Delete',
    deleteConfirm: (title: string) =>
      `Delete the "${title}" module? This also deletes all of its lessons and resources. This can't be undone.`,
    createHeading: 'Create a new module',
    placeholder: 'E.g. "Module 1 - Introduction"',
    create: 'Create',
    creating: 'Creating…',
  },
};

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
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];

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

  // Solo se muestran los controles de crear/eliminar si el rol REALMENTE
  // los puede usar (ver lib/api.ts, getCoursePermissions) — un Estudiante
  // (solo "module:view") ya no ve un botón "Eliminar" ni el formulario de
  // "Crear un módulo nuevo" que de todas formas el backend le rechazaría.
  const permissions = await getCoursePermissions(token, courseId);
  const canCreate = can(permissions, 'module', 'create');
  const canEdit = can(permissions, 'module', 'edit');
  const canDelete = can(permissions, 'module', 'delete');

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/cursos/${courseId}`} className="text-sm text-zinc-500 hover:underline">
        &larr; {course.title}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{t.title}</h1>

      {modules.length === 0 ? (
        <p className="mb-8 text-zinc-500">{t.empty}</p>
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
              <div className="flex items-center gap-3">
                {canEdit && (
                  <ActualizarModuloForm
                    courseId={courseId}
                    moduleId={module.id}
                    title={module.title}
                    saveLabel={t.save}
                    savingLabel={t.saving}
                  />
                )}
                {canDelete && (
                  <EliminarModuloButton
                    courseId={courseId}
                    moduleId={module.id}
                    confirmMessage={t.deleteConfirm(module.title)}
                    label={t.delete}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canCreate && (
        <>
          <h2 className="mb-3 text-lg font-medium">{t.createHeading}</h2>
          <CrearModuloForm
            courseId={courseId}
            placeholder={t.placeholder}
            submitLabel={t.create}
            submittingLabel={t.creating}
          />
        </>
      )}
    </div>
  );
}
