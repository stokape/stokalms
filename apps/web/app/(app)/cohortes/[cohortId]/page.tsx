// ============================================================================
// cohortes/[cohortId]/page.tsx — Detalle de una cohorte: sus miembros,
// agregar/quitar alumnos. Requiere "cohort:view" para entrar;
// agregar/quitar exige "cohort:assign" (Coordinador académico también lo
// tiene); borrar la cohorte exige "cohort:delete" (solo Super Admin/
// Administrador de entidad).
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, getPermissions, can, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmitButton';
import { selectClasses } from '@/components/ui/field-styles';
import { getLocale } from '@/lib/locale';
import { agregarMiembro, quitarMiembro, eliminarCohorte } from '../actions';

const TEXT = {
  es: {
    back: '← Cohortes',
    membersTitle: 'Miembros',
    noMembers: 'Todavía no hay nadie en esta cohorte.',
    remove: 'Quitar',
    removeConfirm: (name: string) => `¿Quitar a ${name} de esta cohorte?`,
    addMember: 'Agregar alumno',
    pickPerson: 'Elige a quién agregar',
    add: 'Agregar',
    deleteCohort: 'Eliminar cohorte',
    deleteCohortConfirm: (name: string) => `¿Eliminar la cohorte "${name}"? No se puede deshacer.`,
    everyoneAssigned: 'No hay nadie más para agregar (o ya están todos en esta cohorte).',
  },
  en: {
    back: '← Cohorts',
    membersTitle: 'Members',
    noMembers: 'No one is in this cohort yet.',
    remove: 'Remove',
    removeConfirm: (name: string) => `Remove ${name} from this cohort?`,
    addMember: 'Add student',
    pickPerson: 'Choose who to add',
    add: 'Add',
    deleteCohort: 'Delete cohort',
    deleteCohortConfirm: (name: string) => `Delete the "${name}" cohort? This can't be undone.`,
    everyoneAssigned: 'No one else to add (or everyone is already in this cohort).',
  },
};

interface CohortDetail {
  id: string;
  name: string;
  description: string | null;
  members: Array<{ userTenantId: string; fullName: string; email: string }>;
}

interface Member {
  userTenantId: string;
  email: string;
  fullName: string;
}

export default async function CohortDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ cohortId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { cohortId } = await params;
  const { error } = await searchParams;
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];
  const permissions = await getPermissions(token);
  const canDelete = can(permissions, 'cohort', 'delete');

  let cohort: CohortDetail;
  let allMembers: Member[];
  try {
    [cohort, allMembers] = await Promise.all([
      apiFetch<CohortDetail>(token, `/cohorts/${cohortId}`),
      apiFetch<Member[]>(token, '/users'),
    ]);
  } catch (err) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorBanner message={toErrorMessage(err)} />
      </div>
    );
  }

  const memberIds = new Set(cohort.members.map((m) => m.userTenantId));
  const available = allMembers.filter((m) => !memberIds.has(m.userTenantId));

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/cohortes" className="mb-3 inline-block text-sm text-muted hover:underline">
        {t.back}
      </Link>

      <PageHeader
        title={cohort.name}
        description={cohort.description ?? undefined}
        actions={
          canDelete && (
            <form action={eliminarCohorte.bind(null, cohortId)}>
              <ConfirmSubmitButton
                variant="danger"
                size="sm"
                confirmMessage={t.deleteCohortConfirm(cohort.name)}
              >
                {t.deleteCohort}
              </ConfirmSubmitButton>
            </form>
          )
        }
      />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      <h2 className="mb-3 text-base font-medium">{t.membersTitle}</h2>
      <Card className="mb-8">
        {cohort.members.length === 0 ? (
          <p className="mb-4 text-sm text-muted">{t.noMembers}</p>
        ) : (
          <ul className="mb-4 divide-y divide-border">
            {cohort.members.map((m) => (
              <li key={m.userTenantId} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.fullName}</p>
                  <p className="truncate text-xs text-muted">{m.email}</p>
                </div>
                <form action={quitarMiembro.bind(null, cohortId, m.userTenantId)}>
                  <ConfirmSubmitButton
                    className="shrink-0 text-xs font-medium text-danger hover:underline"
                    confirmMessage={t.removeConfirm(m.fullName)}
                  >
                    {t.remove}
                  </ConfirmSubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}

        {available.length > 0 ? (
          <form action={agregarMiembro.bind(null, cohortId)} className="flex flex-wrap items-center gap-2">
            <select name="userTenantId" required className={`min-w-[220px] ${selectClasses}`}>
              <option value="">{t.pickPerson}</option>
              {available.map((m) => (
                <option key={m.userTenantId} value={m.userTenantId}>
                  {m.fullName} — {m.email}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary" size="sm">
              {t.add}
            </Button>
          </form>
        ) : (
          <p className="text-xs text-muted">{t.everyoneAssigned}</p>
        )}
      </Card>
    </div>
  );
}
