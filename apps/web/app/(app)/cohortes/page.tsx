// ============================================================================
// cohortes/page.tsx — Listado de cohortes ("Promoción 2026", "Turno
// mañana"...) — ver apps/api/src/modules/cohort/. Requiere "cohort:view"
// (Super Admin, Administrador de entidad, Coordinador académico — ver
// prisma/seed.js). Crear/borrar cohortes exige además "cohort:create"/
// "cohort:delete" (solo Super Admin/Administrador de entidad) — el
// Coordinador ve la lista y entra a cada cohorte a asignar alumnos, pero
// no puede crear una nueva ni borrar una existente.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, getPermissions, can, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CohortIcon } from '@/components/ui/icons';
import { fieldClasses, labelClasses } from '@/components/ui/field-styles';
import { getLocale } from '@/lib/locale';
import { crearCohorte } from './actions';

const TEXT = {
  es: {
    title: 'Cohortes',
    description: 'Agrupa alumnos (ej. "Promoción 2026", "Turno mañana") para matricular y reportar en bloque.',
    members: (n: number) => `${n} ${n === 1 ? 'miembro' : 'miembros'}`,
    manage: 'Gestionar →',
    empty: 'Todavía no hay cohortes creadas.',
    emptyWithCreate: 'Creá la primera para agrupar alumnos y matricularlos en bloque.',
    emptyNoCreate: 'Pedile a un administrador de la institución que cree una.',
    createCta: 'Crear cohorte ↓',
    createTitle: 'Crear cohorte',
    nameLabel: 'Nombre',
    namePlaceholder: 'Ej. Promoción 2026',
    descriptionLabel: 'Descripción (opcional)',
    create: 'Crear cohorte',
  },
  en: {
    title: 'Cohorts',
    description: 'Group students (e.g. "Class of 2026", "Morning shift") to enroll and report on in bulk.',
    members: (n: number) => `${n} ${n === 1 ? 'member' : 'members'}`,
    manage: 'Manage →',
    empty: 'No cohorts created yet.',
    emptyWithCreate: 'Create the first one to group students and enroll them in bulk.',
    emptyNoCreate: 'Ask an institution administrator to create one.',
    createCta: 'Create cohort ↓',
    createTitle: 'Create cohort',
    nameLabel: 'Name',
    namePlaceholder: 'E.g. Class of 2026',
    descriptionLabel: 'Description (optional)',
    create: 'Create cohort',
  },
};

interface Cohort {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number };
}

export default async function CohortesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

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
          <form action={crearCohorte} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className={labelClasses}>{t.nameLabel}</span>
              <input name="name" type="text" required maxLength={120} placeholder={t.namePlaceholder} className={fieldClasses} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className={labelClasses}>{t.descriptionLabel}</span>
              <input name="description" type="text" maxLength={500} className={fieldClasses} />
            </label>
            <Button type="submit" className="self-start">
              {t.create}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
