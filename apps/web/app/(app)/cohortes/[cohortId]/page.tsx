// ============================================================================
// cohortes/[cohortId]/page.tsx — Detalle de un grupo: sus miembros,
// agregar/quitar alumnos. Requiere "cohort:view" para entrar;
// agregar/quitar exige "cohort:assign" (Coordinador académico también lo
// tiene); borrar el grupo exige "cohort:delete" (solo Super Admin/
// Administrador de entidad).
//
// Agregar/quitar/borrar viven en ../CohorteForms.tsx (Client Components) A
// PROPOSITO -- ver la nota extensa en actions.ts: esas Server Actions ya NO
// llaman a redirect(), necesitan "useActionState" (solo disponible del lado
// del cliente) para poder mostrarle el error a la persona.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, getPermissions, can, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { getLocale } from '@/lib/locale';
import { EliminarGrupoButton, QuitarMiembroButton, AgregarMiembroForm } from '../CohorteForms';

const TEXT = {
  es: {
    back: '← Grupos',
    membersTitle: 'Miembros',
    noMembers: 'Todavía no hay nadie en este grupo.',
    remove: 'Quitar',
    removeConfirm: (name: string) => `¿Quitar a ${name} de este grupo?`,
    addMember: 'Agregar alumno',
    pickPerson: 'Elige a quién agregar',
    add: 'Agregar',
    adding: 'Agregando…',
    deleteCohort: 'Eliminar grupo',
    deleteCohortConfirm: (name: string) => `¿Eliminar el grupo "${name}"? No se puede deshacer.`,
    everyoneAssigned: 'No hay nadie más para agregar (o ya están todos en este grupo).',
  },
  en: {
    back: '← Groups',
    membersTitle: 'Members',
    noMembers: 'No one is in this group yet.',
    remove: 'Remove',
    removeConfirm: (name: string) => `Remove ${name} from this group?`,
    addMember: 'Add student',
    pickPerson: 'Choose who to add',
    add: 'Add',
    adding: 'Adding…',
    deleteCohort: 'Delete group',
    deleteCohortConfirm: (name: string) => `Delete the "${name}" group? This can't be undone.`,
    everyoneAssigned: 'No one else to add (or everyone is already in this group).',
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
}: {
  params: Promise<{ cohortId: string }>;
}) {
  const { cohortId } = await params;
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
            <EliminarGrupoButton
              cohortId={cohortId}
              confirmMessage={t.deleteCohortConfirm(cohort.name)}
              label={t.deleteCohort}
            />
          )
        }
      />

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
                <QuitarMiembroButton
                  cohortId={cohortId}
                  userTenantId={m.userTenantId}
                  confirmMessage={t.removeConfirm(m.fullName)}
                  label={t.remove}
                />
              </li>
            ))}
          </ul>
        )}

        {available.length > 0 ? (
          <AgregarMiembroForm
            cohortId={cohortId}
            available={available}
            pickPersonLabel={t.pickPerson}
            addLabel={t.add}
            addingLabel={t.adding}
          />
        ) : (
          <p className="text-xs text-muted">{t.everyoneAssigned}</p>
        )}
      </Card>
    </div>
  );
}
