// ============================================================================
// cursos/[courseId]/page.tsx — Detalle de un curso: sus secciones (para
// entrar a matricular/ver estudiantes) y un enlace a la nota final.
//
// "[courseId]" en el nombre de la carpeta es un segmento DINAMICO de
// Next.js: captura lo que venga en esa parte de la URL (ej. "/cursos/abc-123")
// y lo entrega en "params.courseId".
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { asignarEscalaDeNotas } from './actions';

interface Course {
  id: string;
  code: string;
  title: string;
  gradingScaleId: string | null;
}

interface Section {
  id: string;
  name: string;
  capacity: number;
}

interface GradingScale {
  id: string;
  name: string;
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { courseId } = await params;
  const { error } = await searchParams;
  const token = await requireAccessToken();

  let course: Course;
  try {
    course = await apiFetch<Course>(token, `/courses/${courseId}`);
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  // Sin escala de notas asignada, el curso no puede calcular ninguna nota
  // final (ver la validacion en GradebookService.computeCourseGrades, en
  // el backend) — se detecto probando de verdad que un curso de prueba se
  // habia quedado sin ninguna escala asignada, y la pagina de notas
  // mostraba el mensaje TECNICO del backend ("...PATCH /courses/:id...")
  // tal cual a un usuario final, sin ninguna pantalla desde donde
  // solucionarlo. Este formulario cierra ese hueco. Igual que las
  // secciones, se pide en un try/catch separado: un Docente (sin
  // "grading_scale:view") puede perfectamente ver el curso sin ver esto.
  let gradingScales: GradingScale[] | null = null;
  if (!course.gradingScaleId) {
    try {
      gradingScales = await apiFetch<GradingScale[]>(token, '/grading-scales');
    } catch {
      gradingScales = null;
    }
  }

  // Las secciones se piden en un try/catch SEPARADO del curso: un Docente
  // (sin "section:view", ver prisma/seed.js) puede tener perfecto sentido
  // para ver el curso y su nota final, pero no la lista administrativa de
  // secciones/matriculados — eso no deberia tumbar TODA la pagina, solo
  // ocultar esa seccion (mismo patron que las plantillas en
  // matriculas/[enrollmentId]/certificados/page.tsx).
  let sections: Section[] | null = null;
  try {
    sections = await apiFetch<Section[]>(token, `/courses/${courseId}/sections`);
  } catch {
    sections = null;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/cursos" className="text-sm text-zinc-500 hover:underline">
        &larr; Cursos
      </Link>
      <h1 className="mt-2 mb-1 text-2xl font-semibold">{course.title}</h1>
      <p className="mb-6 font-mono text-sm text-zinc-500">{course.code}</p>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {!course.gradingScaleId && gradingScales && (
        <div className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <p className="mb-3 text-sm text-amber-800 dark:text-amber-300">
            Este curso todavía no tiene una escala de notas asignada — hasta que le asignes una, la
            pantalla de notas finales no va a poder calcular nada.
          </p>
          {gradingScales.length === 0 ? (
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Tu institución todavía no creó ninguna escala de notas.
            </p>
          ) : (
            <form action={asignarEscalaDeNotas.bind(null, courseId)} className="flex max-w-sm gap-2">
              <select
                name="gradingScaleId"
                required
                className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                {gradingScales.map((scale) => (
                  <option key={scale.id} value={scale.id}>
                    {scale.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-full bg-foreground px-4 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
              >
                Asignar
              </button>
            </form>
          )}
        </div>
      )}

      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href={`/cursos/${courseId}/modulos`}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Ver contenido del curso
        </Link>
        <Link
          href={`/cursos/${courseId}/evaluaciones`}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Ver evaluaciones
        </Link>
        <Link
          href={`/cursos/${courseId}/notas`}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Ver notas finales del curso
        </Link>
      </div>

      {sections && (
        <>
          <h2 className="mb-3 text-lg font-medium">Secciones</h2>
          {sections.length === 0 ? (
            <p className="text-zinc-500">Este curso todavía no tiene secciones.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {sections.map((section) => (
                <li key={section.id} className="py-3">
                  <Link href={`/cursos/${courseId}/secciones/${section.id}`} className="hover:underline">
                    {section.name}{' '}
                    <span className="text-sm text-zinc-500">
                      (cupo: {section.capacity > 0 ? section.capacity : 'sin límite'})
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
