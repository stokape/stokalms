// ============================================================================
// mis-matriculas/page.tsx — "Mis matrículas": el punto de entrada de
// autoservicio de CUALQUIER persona (tipicamente un Estudiante) para ver en
// que cursos/secciones esta matriculada, sin necesitar ningun permiso
// administrativo — llama a GET /enrollments/mine (ver
// apps/api/src/modules/enrollment/my-enrollments.controller.ts), que
// siempre devuelve SOLO tus propias matriculas, nunca las de otra persona.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/LinkButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { BookmarkIcon } from '@/components/ui/icons';
import { getLocale, type Locale } from '@/lib/locale';

interface MyEnrollment {
  id: string;
  status: 'active' | 'dropped' | 'completed';
  course: { id: string; code: string; title: string };
  section: { id: string; name: string };
}

const ESTADO_LABEL_BY_LOCALE: Record<Locale, Record<string, string>> = {
  es: { active: 'Activo', dropped: 'Retirado', completed: 'Completado' },
  en: { active: 'Active', dropped: 'Dropped', completed: 'Completed' },
};

const ESTADO_TONE: Record<string, BadgeTone> = {
  active: 'success',
  dropped: 'danger',
  completed: 'info',
};

const TEXT = {
  es: {
    title: 'Mis matrículas',
    description: 'Los cursos y secciones en los que estás matriculado.',
    empty: 'Todavía no estás matriculado en ningún curso.',
    emptyDescription: 'Si esperabas ver algo aquí, pídele al coordinador académico de tu institución que revise tu matrícula. Mientras tanto podés explorar los cursos disponibles.',
    browseCourses: 'Ver cursos disponibles',
    section: 'Sección',
    myGrades: 'Mis notas',
    myCertificates: 'Mis certificados',
  },
  en: {
    title: 'My enrollments',
    description: 'The courses and sections you are enrolled in.',
    empty: "You're not enrolled in any course yet.",
    emptyDescription: "If you expected to see something here, ask your institution's academic coordinator to check your enrollment. In the meantime you can browse the available courses.",
    browseCourses: 'Browse available courses',
    section: 'Section',
    myGrades: 'My grades',
    myCertificates: 'My certificates',
  },
};

export default async function MisMatriculasPage() {
  const token = await requireAccessToken();
  const locale = await getLocale();
  const t = TEXT[locale];
  const ESTADO_LABEL = ESTADO_LABEL_BY_LOCALE[locale];

  let enrollments: MyEnrollment[];
  try {
    enrollments = await apiFetch<MyEnrollment[]>(token, '/enrollments/mine');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t.title} description={t.description} />

      {enrollments.length === 0 ? (
        <EmptyState
          icon={BookmarkIcon}
          title={t.empty}
          description={t.emptyDescription}
          action={<LinkButton href="/cursos" variant="secondary">{t.browseCourses}</LinkButton>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <ul className="divide-y divide-border">
            {enrollments.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{e.course.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                    <span>
                      {e.course.code} · {t.section} {e.section.name}
                    </span>
                    <Badge tone={ESTADO_TONE[e.status] ?? 'neutral'}>{ESTADO_LABEL[e.status] ?? e.status}</Badge>
                  </p>
                </div>
                <div className="flex shrink-0 gap-4 text-sm">
                  <Link href={`/cursos/${e.course.id}/notas`} className="font-medium text-primary hover:underline">
                    {t.myGrades}
                  </Link>
                  {e.status === 'completed' && (
                    <Link href={`/matriculas/${e.id}/certificados`} className="font-medium text-primary hover:underline">
                      {t.myCertificates}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
