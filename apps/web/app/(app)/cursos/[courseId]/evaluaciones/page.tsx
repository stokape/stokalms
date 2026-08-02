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
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { crearCategoria, crearEvaluacion, eliminarEvaluacion } from './actions';

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

const TYPE_LABELS: Record<string, string> = {
  exam: 'Examen',
  assignment: 'Tarea',
  forum: 'Foro',
  rubric: 'Rúbrica',
};

export default async function EvaluacionesDelCursoPage({
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
  let assessments: Assessment[];
  try {
    [course, assessments] = await Promise.all([
      apiFetch<Course>(token, `/courses/${courseId}`),
      apiFetch<Assessment[]>(token, `/courses/${courseId}/assessments`),
    ]);
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

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

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/cursos/${courseId}`} className="text-sm text-zinc-500 hover:underline">
        &larr; {course.title}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">Evaluaciones</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {assessments.length === 0 ? (
        <p className="mb-8 text-zinc-500">Este curso todavía no tiene ninguna evaluación.</p>
      ) : (
        <ul className="mb-8 divide-y divide-zinc-200 dark:divide-zinc-800">
          {assessments.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4 py-3">
              <Link href={`/cursos/${courseId}/evaluaciones/${a.id}`} className="hover:underline">
                {a.config.title || `${TYPE_LABELS[a.type] ?? a.type} sin título`}
                <span className="ml-2 text-sm text-zinc-500">
                  ({TYPE_LABELS[a.type] ?? a.type} · {a.maxPoints} pts · {a.maxAttempts}{' '}
                  {a.maxAttempts === 1 ? 'intento' : 'intentos'})
                </span>
              </Link>
              <form action={eliminarEvaluacion.bind(null, courseId, a.id)}>
                <button type="submit" className="text-xs text-red-600 underline dark:text-red-400">
                  Eliminar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {categories && categories.length === 0 && (
        <>
          <h2 className="mb-3 text-lg font-medium">Primero creá una categoría de notas</h2>
          <p className="mb-3 text-sm text-zinc-500">
            Toda evaluación pertenece a una categoría (ej. &quot;Exámenes&quot;, &quot;Tareas&quot;),
            que define cuánto pesa en la nota final del curso.
          </p>
          <form action={crearCategoria.bind(null, courseId)} className="mb-8 flex max-w-xl flex-wrap gap-2">
            <input
              name="name"
              type="text"
              required
              placeholder='Ej. "Exámenes"'
              className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              name="weightPct"
              type="number"
              min={0}
              max={100}
              required
              placeholder="Peso % (ej. 40)"
              className="w-32 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              name="dropLowest"
              type="number"
              min={0}
              defaultValue={0}
              title="Cuántas notas bajas se descartan al promediar"
              className="w-24 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="submit"
              className="rounded-full bg-foreground px-4 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Crear categoría
            </button>
          </form>
        </>
      )}

      {categories && categories.length > 0 && (
        <>
          <h2 className="mb-3 text-lg font-medium">Crear una evaluación nueva</h2>
          <form action={crearEvaluacion.bind(null, courseId)} className="flex max-w-xl flex-col gap-3">
            <input
              name="title"
              type="text"
              placeholder='Título (opcional, ej. "Examen parcial 1")'
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <div className="flex gap-2">
              <select
                name="type"
                required
                className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="exam">Examen</option>
                <option value="assignment">Tarea</option>
                <option value="forum">Foro</option>
                <option value="rubric">Rúbrica</option>
              </select>
              <select
                name="gradebookCategoryId"
                required
                className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <input
                name="maxPoints"
                type="number"
                min={0}
                step="0.01"
                required
                placeholder="Puntaje máximo"
                className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <input
                name="maxAttempts"
                type="number"
                min={1}
                defaultValue={1}
                title="Intentos permitidos"
                className="w-32 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <input type="checkbox" name="autoPublish" />
              Publicar la nota apenas se corrige (sin esperar a &quot;publicar notas&quot; del curso)
            </label>
            <button
              type="submit"
              className="self-start rounded-full bg-foreground px-4 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Crear evaluación
            </button>
          </form>
        </>
      )}
    </div>
  );
}
