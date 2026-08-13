// ============================================================================
// cursos/page.tsx — "GET /cursos": lista todos los cursos del tenant
// activo. Punto de entrada natural para Docentes/Coordinadores (para
// navegar a una seccion y matricular/calificar); un Estudiante tambien
// puede verla (course:view lo tienen todos los roles), aunque su punto de
// entrada mas directo es "Mis matriculas" (ver ../mis-matriculas/page.tsx).
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage, getPermissions, can } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { LinkButton } from '@/components/ui/LinkButton';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { CoursesIcon } from '@/components/ui/icons';
import { fieldClasses } from '@/components/ui/field-styles';
import { getLocale } from '@/lib/locale';

interface Course {
  id: string;
  code: string;
  title: string;
}

const TEXT = {
  es: {
    title: 'Cursos',
    description: 'Todos los cursos de tu institución.',
    create: '+ Crear curso',
    empty: 'Todavía no hay cursos registrados en esta institución.',
    emptyWithCreate: 'Creá el primero para empezar a armar secciones y matricular alumnos.',
    searchPlaceholder: 'Buscar por nombre o código…',
    searchButton: 'Buscar',
    noResults: (q: string) => `Ningún curso coincide con "${q}".`,
    clearSearch: 'Ver todos los cursos',
  },
  en: {
    title: 'Courses',
    description: 'All the courses at your institution.',
    create: '+ Create course',
    empty: 'No courses have been registered at this institution yet.',
    emptyWithCreate: 'Create the first one to start building sections and enrolling students.',
    searchPlaceholder: 'Search by name or code…',
    searchButton: 'Search',
    noResults: (q: string) => `No course matches "${q}".`,
    clearSearch: 'View all courses',
  },
};

export default async function CursosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];

  let courses: Course[];
  try {
    courses = await apiFetch<Course[]>(token, '/courses');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  // Filtro del lado del servidor sobre la lista YA traída — no hace falta
  // un query param nuevo en el backend (el volumen de cursos de una
  // institución no justifica paginar la API todavía, ver la nota similar
  // en usuarios/page.tsx). Sin JavaScript: es un <form> GET normal, el
  // resultado vive en la URL ("?q=..."), así que también es compartible/
  // recargable.
  const query = (q ?? '').trim().toLowerCase();
  const filteredCourses = query
    ? courses.filter((c) => c.title.toLowerCase().includes(query) || c.code.toLowerCase().includes(query))
    : courses;

  const permissions = await getPermissions(token);
  const canCreate = can(permissions, 'course', 'create');

  return (
    <div>
      <PageHeader
        title={t.title}
        description={t.description}
        actions={canCreate && <LinkButton href="/cursos/nuevo">{t.create}</LinkButton>}
      />

      {courses.length > 5 && (
        <form className="mb-6 flex max-w-sm gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder={t.searchPlaceholder}
            className={fieldClasses}
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-black/[.03] dark:hover:bg-white/[.06]"
          >
            {t.searchButton}
          </button>
        </form>
      )}

      {courses.length === 0 ? (
        <EmptyState
          icon={CoursesIcon}
          title={t.empty}
          description={canCreate ? t.emptyWithCreate : undefined}
          action={canCreate && <LinkButton href="/cursos/nuevo">{t.create}</LinkButton>}
        />
      ) : filteredCourses.length === 0 ? (
        <Card className="text-center text-sm text-muted">
          <p>{t.noResults(q ?? '')}</p>
          <Link href="/cursos" className="mt-2 inline-block text-primary hover:underline">
            {t.clearSearch}
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Link key={course.id} href={`/cursos/${course.id}`} className="group">
              <Card className="flex h-full flex-col gap-3 transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CoursesIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-mono text-xs text-muted">{course.code}</p>
                  <p className="font-medium text-foreground group-hover:text-primary">
                    {course.title}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
