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
import { Button } from '@/components/ui/Button';
import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmitButton';
import { getLocale } from '@/lib/locale';
import { crearModulo, actualizarModulo, eliminarModulo } from './actions';

const TEXT = {
  es: {
    title: 'Contenido del curso',
    empty: 'Este curso todavía no tiene ningún módulo.',
    save: 'Guardar',
    delete: 'Eliminar',
    deleteConfirm: (title: string) =>
      `¿Eliminar el módulo "${title}"? Se borran también todas sus lecciones y recursos. No se puede deshacer.`,
    createHeading: 'Crear un módulo nuevo',
    placeholder: 'Ej. "Módulo 1 - Introducción"',
    create: 'Crear',
  },
  en: {
    title: 'Course content',
    empty: "This course doesn't have any modules yet.",
    save: 'Save',
    delete: 'Delete',
    deleteConfirm: (title: string) =>
      `Delete the "${title}" module? This also deletes all of its lessons and resources. This can't be undone.`,
    createHeading: 'Create a new module',
    placeholder: 'E.g. "Module 1 - Introduction"',
    create: 'Create',
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
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { courseId } = await params;
  const { error } = await searchParams;
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

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

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
                  <form
                    action={actualizarModulo.bind(null, courseId, module.id)}
                    className="flex items-center gap-1"
                  >
                    <input
                      name="title"
                      type="text"
                      defaultValue={module.title}
                      required
                      className="w-40 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    <button type="submit" className="text-xs underline">
                      {t.save}
                    </button>
                  </form>
                )}
                {canDelete && (
                  <form action={eliminarModulo.bind(null, courseId, module.id)}>
                    <ConfirmSubmitButton
                      className="text-xs text-red-600 underline dark:text-red-400"
                      confirmMessage={t.deleteConfirm(module.title)}
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

      {canCreate && (
        <>
          <h2 className="mb-3 text-lg font-medium">{t.createHeading}</h2>
          <form action={crearModulo.bind(null, courseId)} className="flex max-w-sm gap-2">
            <input
              name="title"
              type="text"
              required
              placeholder={t.placeholder}
              className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <Button type="submit">{t.create}</Button>
          </form>
        </>
      )}
    </div>
  );
}
