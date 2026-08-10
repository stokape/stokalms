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
import { CoursesIcon } from '@/components/ui/icons';
import { getLocale } from '@/lib/locale';

interface Course {
  id: string;
  code: string;
  title: string;
}

const TEXT = {
  es: { title: 'Cursos', description: 'Todos los cursos de tu institución.', create: '+ Crear curso', empty: 'Todavía no hay cursos registrados en esta institución.' },
  en: { title: 'Courses', description: 'All the courses at your institution.', create: '+ Create course', empty: 'No courses have been registered at this institution yet.' },
};

export default async function CursosPage() {
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];

  let courses: Course[];
  try {
    courses = await apiFetch<Course[]>(token, '/courses');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  const permissions = await getPermissions(token);
  const canCreate = can(permissions, 'course', 'create');

  return (
    <div>
      <PageHeader
        title={t.title}
        description={t.description}
        actions={canCreate && <LinkButton href="/cursos/nuevo">{t.create}</LinkButton>}
      />

      {courses.length === 0 ? (
        <Card className="text-center text-sm text-muted">{t.empty}</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
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
