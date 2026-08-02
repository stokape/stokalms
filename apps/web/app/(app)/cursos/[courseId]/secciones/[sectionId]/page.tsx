// ============================================================================
// cursos/[courseId]/secciones/[sectionId]/page.tsx — Administracion de UNA
// seccion: quien esta matriculado, cambiar su estado, matricular a alguien
// nuevo y saltar a sus certificados. Pensada para Coordinador
// académico/Docente (necesitan "enrollment:view"/"enrollment:create"/
// "enrollment:delete" — ver prisma/seed.js); un Estudiante que la abra va a
// ver el ErrorBanner de "no tienes permiso", que es la respuesta correcta:
// su punto de entrada es "Mis matriculas", no esta pantalla administrativa.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { matricular, matricularCSV, cambiarEstadoMatricula } from './actions';

interface Section {
  id: string;
  name: string;
}

interface EnrollmentRow {
  id: string;
  status: 'active' | 'dropped' | 'completed';
  student: { userId: string; email: string; fullName: string };
}

const ESTADO_LABEL: Record<string, string> = {
  active: 'Activo',
  dropped: 'Retirado',
  completed: 'Completado',
};

export default async function SectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; sectionId: string }>;
  searchParams: Promise<{ error?: string; bulkOk?: string; bulkErrors?: string }>;
}) {
  const { courseId, sectionId } = await params;
  const { error, bulkOk, bulkErrors } = await searchParams;
  const parsedBulkErrors: Array<{ email: string; message?: string }> = bulkErrors
    ? JSON.parse(bulkErrors)
    : [];
  const token = await requireAccessToken();

  let section: Section;
  let enrollments: EnrollmentRow[];
  try {
    section = await apiFetch<Section>(token, `/courses/${courseId}/sections/${sectionId}`);
    enrollments = await apiFetch<EnrollmentRow[]>(
      token,
      `/courses/${courseId}/sections/${sectionId}/enrollments`,
    );
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/cursos/${courseId}`} className="text-sm text-zinc-500 hover:underline">
        &larr; Curso
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">Sección: {section.name}</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {bulkOk !== undefined && (
        <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          <p>
            Se matricularon {bulkOk} estudiantes desde el archivo
            {parsedBulkErrors.length > 0 &&
              ` (${parsedBulkErrors.length} ${parsedBulkErrors.length === 1 ? 'fila' : 'filas'} con error)`}.
          </p>
          {parsedBulkErrors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-red-700 dark:text-red-400">
              {parsedBulkErrors.map((e, i) => (
                <li key={i}>
                  {e.email}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <h2 className="mb-3 text-lg font-medium">Estudiantes matriculados</h2>
      {enrollments.length === 0 ? (
        <p className="mb-8 text-zinc-500">Todavía nadie está matriculado en esta sección.</p>
      ) : (
        <table className="mb-8 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="py-2">Estudiante</th>
              <th className="py-2">Estado</th>
              <th className="py-2">Certificados</th>
              <th className="py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <tr key={e.id} className="border-b border-zinc-100 align-top dark:border-zinc-900">
                <td className="py-2">
                  {e.student.fullName}
                  <br />
                  <span className="text-xs text-zinc-500">{e.student.email}</span>
                </td>
                <td className="py-2">{ESTADO_LABEL[e.status] ?? e.status}</td>
                <td className="py-2">
                  <Link href={`/matriculas/${e.id}/certificados`} className="underline">
                    Ver
                  </Link>
                </td>
                <td className="py-2">
                  <div className="flex flex-col gap-1">
                    {e.status !== 'completed' && (
                      <form action={cambiarEstadoMatricula.bind(null, courseId, sectionId, e.id, 'completed')}>
                        <button type="submit" className="text-xs text-green-700 underline dark:text-green-400">
                          Marcar completado
                        </button>
                      </form>
                    )}
                    {e.status === 'active' && (
                      <form action={cambiarEstadoMatricula.bind(null, courseId, sectionId, e.id, 'dropped')}>
                        <button type="submit" className="text-xs text-red-600 underline dark:text-red-400">
                          Retirar
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="mb-3 text-lg font-medium">Matricular estudiante</h2>
      <p className="mb-3 text-sm text-zinc-500">
        Si el email todavía no tiene cuenta en la plataforma, se crea automáticamente (con el
        nombre que pongas abajo); cuando esa persona inicie sesión por primera vez, va a
        encontrar esta matrícula ya lista.
      </p>
      <form action={matricular.bind(null, courseId, sectionId)} className="flex max-w-sm flex-col gap-3">
        <input
          name="email"
          type="email"
          required
          placeholder="Email del estudiante"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          name="fullName"
          type="text"
          placeholder="Nombre completo (solo si es una persona nueva)"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-full bg-foreground px-4 py-2 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Matricular
        </button>
      </form>

      <h2 className="mt-10 mb-3 text-lg font-medium">Matricular varios a la vez (CSV)</h2>
      <p className="mb-3 text-sm text-zinc-500">
        Un archivo de texto con dos columnas separadas por coma: <code>email,nombre completo</code>
        , una fila por estudiante (el nombre solo hace falta para quien todavía no tiene cuenta). Si
        alguna fila falla (email repetido, cupo lleno), el resto se matricula igual — al final se
        muestra un detalle de qué filas fallaron y por qué.
      </p>
      <form
        action={matricularCSV.bind(null, courseId, sectionId)}
        className="flex max-w-sm flex-col gap-3"
      >
        <input name="file" type="file" accept=".csv,text/csv" required className="text-sm" />
        <button
          type="submit"
          className="self-start rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Subir CSV
        </button>
      </form>
    </div>
  );
}
