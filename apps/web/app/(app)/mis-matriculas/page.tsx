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

const TEXT = {
  es: {
    title: 'Mis matrículas',
    empty: 'Todavía no estás matriculado en ningún curso. Si esperabas ver algo aquí, pídele al coordinador académico de tu institución que revise tu matrícula.',
    section: 'Sección',
    myGrades: 'Mis notas',
    myCertificates: 'Mis certificados',
  },
  en: {
    title: 'My enrollments',
    empty: "You're not enrolled in any course yet. If you expected to see something here, ask your institution's academic coordinator to check your enrollment.",
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
      <h1 className="mb-6 text-2xl font-semibold">{t.title}</h1>

      {enrollments.length === 0 ? (
        <p className="text-zinc-500">{t.empty}</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {enrollments.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium">{e.course.title}</p>
                <p className="text-sm text-zinc-500">
                  {e.course.code} · {t.section} {e.section.name} · {ESTADO_LABEL[e.status] ?? e.status}
                </p>
              </div>
              <div className="flex shrink-0 gap-3 text-sm">
                <Link href={`/cursos/${e.course.id}/notas`} className="underline">
                  {t.myGrades}
                </Link>
                {e.status === 'completed' && (
                  <Link href={`/matriculas/${e.id}/certificados`} className="underline">
                    {t.myCertificates}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
