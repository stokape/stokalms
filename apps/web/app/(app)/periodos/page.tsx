// ============================================================================
// periodos/page.tsx — Periodos académicos (Term): opcional desde que un
// curso puede crearse sin ninguno (ver create-course.dto.ts) — antes era
// un paso OBLIGATORIO antes de poder crear el primer curso, lo que
// bloqueaba a cualquier institución nueva sin ninguno todavía creado. Hoy
// solo Coordinador académico/Administrador tienen "term:create" (ver
// prisma/seed.js).
//
// Crear/eliminar viven en PeriodosForms.tsx (Client Components) A PROPOSITO
// -- ver la nota extensa en actions.ts: esas Server Actions ya NO llaman a
// redirect(), necesitan "useActionState" (solo disponible del lado del
// cliente) para poder mostrarle el error a la persona.
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage, getPermissions, can } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { CalendarIcon } from '@/components/ui/icons';
import { EliminarPeriodoButton, CrearPeriodoForm } from './PeriodosForms';

interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export default async function PeriodosPage() {
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
                {canDelete && <EliminarPeriodoButton termId={term.id} termName={term.name} />}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {canCreate && <CrearPeriodoForm />}
    </div>
  );
}
