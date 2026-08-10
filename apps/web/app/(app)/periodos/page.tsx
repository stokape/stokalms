// ============================================================================
// periodos/page.tsx — Periodos académicos (Term): el primer escalón antes
// de poder crear un curso (todo Course necesita un termId, ver
// create-course.dto.ts). Sin esta pantalla, dar de alta un curso nuevo era
// imposible desde la interfaz — hoy solo Coordinador académico/Administrador
// tienen "term:create" (ver prisma/seed.js).
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage, getPermissions, can } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Button } from '@/components/ui/Button';
import { crearPeriodo } from './actions';

interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export default async function PeriodosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const token = await requireAccessToken();

  let terms: Term[];
  try {
    terms = await apiFetch<Term[]>(token, '/terms');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  const permissions = await getPermissions(token);
  const canCreate = can(permissions, 'term', 'create');

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold">Periodos académicos</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {terms.length === 0 ? (
        <p className="mb-8 text-zinc-500">Todavía no hay ningún periodo académico creado.</p>
      ) : (
        <ul className="mb-8 divide-y divide-zinc-200 dark:divide-zinc-800">
          {terms.map((term) => (
            <li key={term.id} className="py-3">
              <span className="font-medium">{term.name}</span>{' '}
              <span className="text-sm text-zinc-500">
                ({new Date(term.startDate).toLocaleDateString('es-PE')} –{' '}
                {new Date(term.endDate).toLocaleDateString('es-PE')})
              </span>
            </li>
          ))}
        </ul>
      )}

      {canCreate && (
        <>
          <h2 className="mb-3 text-lg font-medium">Crear un periodo nuevo</h2>
          <form action={crearPeriodo} className="flex max-w-sm flex-col gap-3">
            <input
              name="name"
              type="text"
              required
              placeholder='Ej. "2026 - Semestre I"'
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <label className="text-xs text-zinc-500">
              Fecha de inicio
              <input
                name="startDate"
                type="date"
                required
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="text-xs text-zinc-500">
              Fecha de fin
              <input
                name="endDate"
                type="date"
                required
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <Button type="submit" className="self-start">
              Crear periodo
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
