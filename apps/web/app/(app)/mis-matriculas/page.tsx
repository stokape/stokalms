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

interface MyEnrollment {
  id: string;
  status: 'active' | 'dropped' | 'completed';
  course: { id: string; code: string; title: string };
  section: { id: string; name: string };
}

const ESTADO_LABEL: Record<string, string> = {
  active: 'Activo',
  dropped: 'Retirado',
  completed: 'Completado',
};

export default async function MisMatriculasPage() {
  const token = await requireAccessToken();

  let enrollments: MyEnrollment[];
  try {
    enrollments = await apiFetch<MyEnrollment[]>(token, '/enrollments/mine');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold">Mis matrículas</h1>

      {enrollments.length === 0 ? (
        <p className="text-zinc-500">
          Todavía no estás matriculado en ningún curso. Si esperabas ver algo aquí, pídele al
          coordinador académico de tu institución que revise tu matrícula.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {enrollments.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium">{e.course.title}</p>
                <p className="text-sm text-zinc-500">
                  {e.course.code} · Sección {e.section.name} · {ESTADO_LABEL[e.status] ?? e.status}
                </p>
              </div>
              <div className="flex shrink-0 gap-3 text-sm">
                <Link href={`/cursos/${e.course.id}/notas`} className="underline">
                  Mis notas
                </Link>
                {e.status === 'completed' && (
                  <Link href={`/matriculas/${e.id}/certificados`} className="underline">
                    Mis certificados
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
