// ============================================================================
// cohortes/page.tsx — Listado de grupos ("Promoción 2026", "Turno mañana"...)
// — ver apps/api/src/modules/cohort/ (el modelo/permiso en el backend se
// sigue llamando "cohort"; la ruta "/cohortes" también, para no romper
// enlaces existentes — solo el nombre que ve la persona usuaria cambió a
// "Grupo", más claro que "cohorte"). Requiere "cohort:view" (Super Admin,
// Administrador de entidad, Coordinador académico — ver prisma/seed.js).
// Crear/borrar un grupo exige además "cohort:create"/"cohort:delete" (solo
// Super Admin/Administrador de entidad) — el Coordinador ve la lista y
// entra a cada grupo a asignar alumnos, pero no puede crear uno nuevo ni
// borrar uno existente.
//
// Crear vive en CohorteForms.tsx (Client Component) A PROPOSITO -- ver la
// nota extensa en actions.ts: esa Server Action ya NO llama a redirect(),
// necesita "useActionState" (solo disponible del lado del cliente) para
// poder mostrarle el error a la persona.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, getPermissions, can, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { CohortIcon } from '@/components/ui/icons';
import { getLocale } from '@/lib/locale';
import { CrearGrupoForm } from './CohorteForms';

const TEXT = {
  es: {
    title: 'Grupos',
    description: 'Agrupa alumnos (ej. "Promoción 2026", "Turno mañana") para matricular y reportar en bloque.',
    members: (n: number) => `${n} ${n === 1 ? 'miembro' : 'miembros'}`,
    manage: 'Gestionar →',
    empty: 'Todavía no hay grupos creados.',
    emptyWithCreate: 'Creá el primero para agrupar alumnos y matricularlos en bloque.',
    emptyNoCreate: 'Pedile a un administrador de la institución que cree uno.',
    createCta: 'Crear grupo ↓',
    createTitle: 'Crear grupo',
    nameLabel: 'Nombre',
    namePlaceholder: 'Ej. Promoción 2026',
    descriptionLabel: 'Descripción (opcional)',
    create: 'Crear grupo',
    creating: 'Creando…',
  },
  en: {
    title: 'Groups',
    description: 'Group students (e.g. "Class of 2026", "Morning shift") to enroll and report on in bulk.',
    members: (n: number) => `${n} ${n === 1 ? 'member' : 'members'}`,
    manage: 'Manage →',
    empty: 'No groups created yet.',
    emptyWithCreate: 'Create the first one to group students and enroll them in bulk.',
    emptyNoCreate: 'Ask an institution administrator to create one.',
    createCta: 'Create group ↓',
    createTitle: 'Create group',
    nameLabel: 'Name',
    namePlaceholder: 'E.g. Class of 2026',
    descriptionLabel: 'Description (optional)',
    create: 'Create group',
    creating: 'Creating…',
  },
};

interface Cohort {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number };
}

export default async function CohortesPage() {
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];
  const permissions = await getPermissions(token);
  const canCreate = can(permissions, 'cohort', 'create');

  let cohorts: Cohort[];
  try {
    cohorts = await apiFetch<Cohort[]>(token, '/cohorts');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t.title} description={t.description} />

      {cohorts.length === 0 ? (
        <div className="mb-8">
          <EmptyState
            icon={CohortIcon}
            title={t.empty}
            description={canCreate ? t.emptyWithCreate : t.emptyNoCreate}
            action={
              canCreate && (
                <a href="#crear-cohorte" className="text-sm font-medium text-primary hover:underline">
                  {t.createCta}
                </a>
              )
            }
          />
        </div>
      ) : (
        <div className="mb-8 overflow-hidden rounded-xl border border-border bg-surface">
          <ul className="divide-y divide-border">
            {cohorts.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="font-medium">{c.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {c.description ? `${c.description} · ` : ''}
                    {t.members(c._count.members)}
                  </p>
                </div>
                <Link href={`/cohortes/${c.id}`} className="shrink-0 text-sm font-medium text-primary hover:underline">
                  {t.manage}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canCreate && (
        <Card id="crear-cohorte">
          <h2 className="mb-4 text-base font-medium">{t.createTitle}</h2>
          <CrearGrupoForm
            nameLabel={t.nameLabel}
            namePlaceholder={t.namePlaceholder}
            descriptionLabel={t.descriptionLabel}
            submitLabel={t.create}
            submittingLabel={t.creating}
          />
        </Card>
      )}
    </div>
  );
}
