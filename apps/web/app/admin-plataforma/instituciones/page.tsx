// ============================================================================
// admin-plataforma/instituciones/page.tsx — Listado de TODAS las
// instituciones de la plataforma, con su estado (activa/desactivada) y un
// acceso directo a gestionar cada una (ver [tenantId]/page.tsx: dominios,
// miembros y roles). Protegida por PlatformAdminGuard en el backend, igual
// que solicitudes/page.tsx (ver la nota extensa ahi).
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { getLocale } from '@/lib/locale';
import { cambiarEstadoInstitucion } from './actions';

const TEXT = {
  es: {
    title: 'Instituciones',
    description: 'Activar/desactivar cualquier institución, y administrar sus dominios y roles.',
    active: 'Activa',
    inactive: 'Desactivada',
    maintenance: 'Mantenimiento',
    members: (n: number) => `${n} ${n === 1 ? 'persona' : 'personas'}`,
    noDomain: 'sin dominio',
    manage: 'Gestionar →',
    deactivate: 'Desactivar',
    activate: 'Activar',
    empty: 'Todavía no hay instituciones creadas.',
  },
  en: {
    title: 'Institutions',
    description: 'Activate/deactivate any institution, and manage its domains and roles.',
    active: 'Active',
    inactive: 'Deactivated',
    maintenance: 'Maintenance',
    members: (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`,
    noDomain: 'no domain',
    manage: 'Manage →',
    deactivate: 'Deactivate',
    activate: 'Activate',
    empty: 'No institutions created yet.',
  },
};

interface TenantSummary {
  id: string;
  name: string;
  plan: string;
  active: boolean;
  maintenanceMode: boolean;
  createdAt: string;
  memberCount: number;
  primaryDomain: string | null;
  domainCount: number;
}

export default async function InstitucionesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];

  let tenants: TenantSummary[];
  try {
    tenants = await apiFetch<TenantSummary[]>(token, '/platform/tenants');
  } catch (err) {
    return (
      <div className="mx-auto max-w-3xl px-6">
        <ErrorBanner message={toErrorMessage(err)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6">
      <PageHeader title={t.title} description={t.description} />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      {tenants.length === 0 ? (
        <p className="text-sm text-muted">{t.empty}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <ul className="divide-y divide-border">
            {tenants.map((tn) => (
              <li key={tn.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{tn.name}</span>
                    {tn.active ? (
                      <Badge tone="success">{t.active}</Badge>
                    ) : (
                      <Badge tone="danger">{t.inactive}</Badge>
                    )}
                    {tn.maintenanceMode && <Badge tone="warning">{t.maintenance}</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {tn.primaryDomain ?? t.noDomain} · {tn.plan} · {t.members(tn.memberCount)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <form action={cambiarEstadoInstitucion.bind(null, tn.id, !tn.active)}>
                    <button
                      type="submit"
                      className={`text-xs font-medium hover:underline ${tn.active ? 'text-danger' : 'text-success'}`}
                    >
                      {tn.active ? t.deactivate : t.activate}
                    </button>
                  </form>
                  <Link
                    href={`/admin-plataforma/instituciones/${tn.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {t.manage}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
