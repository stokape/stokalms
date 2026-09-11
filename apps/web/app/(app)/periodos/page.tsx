// ============================================================================
// periodos/page.tsx — Periodos académicos (Term): opcional desde que un
// curso puede crearse sin ninguno (ver create-course.dto.ts) — antes era
// un paso OBLIGATORIO antes de poder crear el primer curso, lo que
// bloqueaba a cualquier institución nueva sin ninguno todavía creado. Hoy
// solo Coordinador académico/Administrador tienen "term:create" (ver
// prisma/seed.js).
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage, getPermissions, can } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmitButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CalendarIcon } from '@/components/ui/icons';
import { fieldClasses, labelClasses } from '@/components/ui/field-styles';
import { crearPeriodo, eliminarPeriodo } from './actions';

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
  const canDelete = can(permissions, 'term', 'delete');

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Periodos académicos"
        description="Agrupan cursos por ciclo/semestre. Son opcionales: un curso se puede crear sin periodo y asignarle uno después."
      />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      <Card className="mb-8">
        {terms.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title="Todavía no hay ningún periodo académico creado."
            description="No hace falta crear uno para empezar — se puede crear un curso sin periodo y asignárselo más adelante."
          />
        ) : (
          <ul className="divide-y divide-border">
            {terms.map((term) => (
              <li key={term.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <span className="font-medium">{term.name}</span>{' '}
                  <span className="text-sm text-muted">
                    ({new Date(term.startDate).toLocaleDateString('es-PE')} –{' '}
                    {new Date(term.endDate).toLocaleDateString('es-PE')})
                  </span>
                </div>
                {canDelete && (
                  <form action={eliminarPeriodo.bind(null, term.id)}>
                    <ConfirmSubmitButton
                      variant="danger"
                      size="sm"
                      confirmMessage={`¿Eliminar el periodo "${term.name}"? Esto solo funciona si ningún curso lo usa todavía.`}
                    >
                      Eliminar
                    </ConfirmSubmitButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {canCreate && (
        <Card>
          <h2 className="mb-3 text-base font-medium">Crear un periodo nuevo</h2>
          <form action={crearPeriodo} className="flex max-w-sm flex-col gap-3">
            <input
              name="name"
              type="text"
              required
              maxLength={120}
              placeholder='Ej. "2026 - Semestre I"'
              className={fieldClasses}
            />
            <label className={labelClasses} htmlFor="term-start">
              Fecha de inicio
              <input id="term-start" name="startDate" type="date" required className={`mt-1 ${fieldClasses}`} />
            </label>
            <label className={labelClasses} htmlFor="term-end">
              Fecha de fin
              <input id="term-end" name="endDate" type="date" required className={`mt-1 ${fieldClasses}`} />
            </label>
            <Button type="submit" className="self-start">
              Crear periodo
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
