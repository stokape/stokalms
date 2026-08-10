// ============================================================================
// notas/page.tsx — "Notas" como sección propia del menú principal, en vez
// de quedar escondida como un enlace suelto dentro del detalle de cada
// curso (donde había que entrar primero a "Cursos" para encontrarla).
//
// Muestra DOS listas posibles, cada una en su propio try/catch (mismo
// criterio que el resto de la app: un permiso que falta no debe romper la
// sección que sí corresponde a este rol):
//   - "Todos los cursos" (GET /courses): para quien administra notas
//     (Docente/Coordinador/Administrador, permiso "grade:view").
//   - "Tus cursos" (GET /enrollments/mine): autoservicio para un Estudiante,
//     sin necesitar ningún permiso administrativo.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { selectClasses } from '@/components/ui/field-styles';
import { ChartIcon } from '@/components/ui/icons';
import { getLocale } from '@/lib/locale';

const TEXT = {
  es: {
    title: 'Notas',
    byCourse: 'Notas por curso',
    term: 'Periodo académico',
    all: 'Todos',
    filter: 'Filtrar',
    noCourses: 'Todavía no hay ningún curso creado.',
    yourGrades: 'Tus notas',
    notEnrolled: 'Todavía no estás matriculado en ningún curso.',
  },
  en: {
    title: 'Grades',
    byCourse: 'Grades by course',
    term: 'Academic term',
    all: 'All',
    filter: 'Filter',
    noCourses: 'No courses have been created yet.',
    yourGrades: 'Your grades',
    notEnrolled: "You're not enrolled in any course yet.",
  },
};

interface Term {
  id: string;
  name: string;
}

interface Course {
  id: string;
  code: string;
  title: string;
}

interface EnrollmentMine {
  id: string;
  course: { id: string; code: string; title: string };
  section: { id: string; name: string };
}

function CourseRow({ href, title, meta }: { href: string; title: string; meta: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-primary/[.04]"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <ChartIcon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium">{title}</p>
        <p className="truncate text-xs text-muted">{meta}</p>
      </div>
    </Link>
  );
}

export default async function NotasPage({
  searchParams,
}: {
  searchParams: Promise<{ termId?: string }>;
}) {
  const { termId } = await searchParams;
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];

  // "año" (Periodo académico) es el primer filtro en cascada — ver la nota
  // en cursos/[courseId]/notas/page.tsx sobre por que el orden real es
  // año → curso → sección (Section cuelga de Course, no al revés).
  let terms: Term[] | null = null;
  try {
    terms = await apiFetch<Term[]>(token, '/terms');
  } catch {
    terms = null;
  }

  let allCourses: Course[] | null = null;
  try {
    allCourses = await apiFetch<Course[]>(token, termId ? `/courses?termId=${termId}` : '/courses');
  } catch {
    allCourses = null;
  }

  let myEnrollments: EnrollmentMine[] | null = null;
  try {
    myEnrollments = await apiFetch<EnrollmentMine[]>(token, '/enrollments/mine');
  } catch {
    myEnrollments = null;
  }

  if (!allCourses && !myEnrollments) {
    return <ErrorBanner message={toErrorMessage(new Error())} />;
  }

  return (
    <div>
      <PageHeader title={t.title} />

      {allCourses && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-medium">{t.byCourse}</h2>

          {terms && terms.length > 0 && (
            <form method="get" className="mb-4 flex items-center gap-2">
              <label className="text-sm text-muted" htmlFor="termId">
                {t.term}:
              </label>
              <select id="termId" name="termId" defaultValue={termId ?? ''} className={selectClasses + ' w-auto'}>
                <option value="">{t.all}</option>
                {terms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="secondary" size="sm">
                {t.filter}
              </Button>
            </form>
          )}

          {allCourses.length === 0 ? (
            <Card className="text-sm text-muted">{t.noCourses}</Card>
          ) : (
            <Card className="divide-y divide-border p-0">
              {allCourses.map((c) => (
                <CourseRow key={c.id} href={`/cursos/${c.id}/notas`} title={c.title} meta={c.code} />
              ))}
            </Card>
          )}
        </div>
      )}

      {myEnrollments && (
        <div>
          <h2 className="mb-3 text-lg font-medium">{t.yourGrades}</h2>
          {myEnrollments.length === 0 ? (
            <Card className="text-sm text-muted">{t.notEnrolled}</Card>
          ) : (
            <Card className="divide-y divide-border p-0">
              {myEnrollments.map((e) => (
                <CourseRow
                  key={e.id}
                  href={`/cursos/${e.course.id}/notas`}
                  title={e.course.title}
                  meta={`${e.course.code} · ${e.section.name}`}
                />
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
