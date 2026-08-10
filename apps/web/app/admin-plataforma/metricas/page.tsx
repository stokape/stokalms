// ============================================================================
// admin-plataforma/metricas/page.tsx — Resumen del embudo de incorporacion
// (onboarding): cuantas visitas llegan a la landing, cuantas buscan su
// institucion en /entrar (y la encuentran o no), cuantos inician sesion (de
// institucion o de administracion) y cuantos la completan, mas el embudo de
// alta de instituciones nuevas (solicitud -> aprobada). Pensado para
// responder UNA pregunta practica: "¿donde se cae la gente antes de
// terminar de entrar?" — no un panel de analytics general.
//
// Mismo patron que solicitudes/page.tsx: fuera del route group "(app)"
// (esto no es negocio de ningun tenant), protegido por PlatformAdminGuard
// del lado del backend (ver GET /analytics/funnel) — si la cuenta no esta
// en PLATFORM_ADMIN_EMAILS, esta pantalla muestra el mismo ErrorBanner que
// cualquier otra sin permiso, no un 500 ni una pantalla en blanco.
// ============================================================================

import { requireAccessToken, apiFetch, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { getLocale } from '@/lib/locale';

const TEXT = {
  es: {
    title: 'Métricas de incorporación',
    description: (days: number) => `Últimos ${days} días — ver más abajo cómo cambiar el período.`,
    institutionPath: 'Camino de una institución',
    landingViews: 'Visitas a la landing',
    searched: 'Buscaron su institución en /entrar',
    searchDetail: (found: number, notFound: number) => `${found} la encontraron · ${notFound} no`,
    loginsStarted: 'Iniciaron sesión (clic en el botón)',
    loginsStartedDetail: (inst: number, admin: number) => `${inst} institución · ${admin} administración`,
    loginsCompleted: 'Completaron el login',
    newInstitutions: 'Alta de instituciones nuevas',
    formsSubmitted: 'Formularios de inscripción enviados',
    approved: 'Aprobadas',
    approvedDetail: (pending: number, rejected: number) => `${pending} pendientes · ${rejected} rechazadas`,
    historicalNote: (days: number) => `Este conteo de solicitudes es histórico (no está acotado a los últimos ${days} días) — se ven todas las que existen.`,
    changePeriod: 'Cambiar el período: agrega',
    changePeriodSuffix: '(o cualquier número) a la URL.',
  },
  en: {
    title: 'Onboarding metrics',
    description: (days: number) => `Last ${days} days — see below how to change the period.`,
    institutionPath: "An institution's journey",
    landingViews: 'Landing page views',
    searched: 'Searched for their institution in /entrar',
    searchDetail: (found: number, notFound: number) => `${found} found it · ${notFound} did not`,
    loginsStarted: 'Started login (clicked the button)',
    loginsStartedDetail: (inst: number, admin: number) => `${inst} institution · ${admin} administration`,
    loginsCompleted: 'Completed login',
    newInstitutions: 'New institution sign-ups',
    formsSubmitted: 'Registration forms submitted',
    approved: 'Approved',
    approvedDetail: (pending: number, rejected: number) => `${pending} pending · ${rejected} rejected`,
    historicalNote: (days: number) => `This request count is historical (not limited to the last ${days} days) — it shows everything that exists.`,
    changePeriod: 'Change the period: add',
    changePeriodSuffix: '(or any number) to the URL.',
  },
};

interface FunnelSummary {
  windowDays: number;
  landingViews: number;
  entrarSearches: { total: number; found: number; notFound: number };
  loginsStarted: { total: number; institution: number; platformAdmin: number };
  loginsCompleted: number;
  registrationsSubmitted: number;
  registrationRequests: { pending: number; approved: number; rejected: number };
}

export default async function MetricasPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days } = await searchParams;
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];

  let funnel: FunnelSummary;
  try {
    funnel = await apiFetch<FunnelSummary>(
      token,
      `/analytics/funnel${days ? `?days=${encodeURIComponent(days)}` : ''}`,
    );
  } catch (err) {
    return (
      <div className="mx-auto max-w-3xl px-6">
        <ErrorBanner message={toErrorMessage(err)} />
      </div>
    );
  }

  const { entrarSearches, loginsStarted, registrationRequests } = funnel;

  return (
    <div className="mx-auto max-w-3xl px-6">
      <PageHeader title={t.title} description={t.description(funnel.windowDays)} />

      <Card className="mb-6">
        <h2 className="mb-4 text-sm font-semibold text-muted">{t.institutionPath}</h2>
        <div className="flex flex-col gap-3">
          <FunnelStep
            label={t.landingViews}
            value={funnel.landingViews}
            max={funnel.landingViews}
          />
          <FunnelStep
            label={t.searched}
            value={entrarSearches.total}
            max={funnel.landingViews}
            detail={t.searchDetail(entrarSearches.found, entrarSearches.notFound)}
          />
          <FunnelStep
            label={t.loginsStarted}
            value={loginsStarted.total}
            max={funnel.landingViews}
            detail={t.loginsStartedDetail(loginsStarted.institution, loginsStarted.platformAdmin)}
          />
          <FunnelStep
            label={t.loginsCompleted}
            value={funnel.loginsCompleted}
            max={funnel.landingViews}
            tone={
              loginsStarted.total > 0 && funnel.loginsCompleted / loginsStarted.total < 0.7
                ? 'warning'
                : 'default'
            }
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-muted">{t.newInstitutions}</h2>
        <div className="flex flex-col gap-3">
          <FunnelStep
            label={t.formsSubmitted}
            value={funnel.registrationsSubmitted}
            max={funnel.registrationsSubmitted}
          />
          <FunnelStep
            label={t.approved}
            value={registrationRequests.approved}
            max={funnel.registrationsSubmitted || registrationRequests.approved}
            detail={t.approvedDetail(registrationRequests.pending, registrationRequests.rejected)}
          />
        </div>
        <p className="mt-4 text-xs text-muted">{t.historicalNote(funnel.windowDays)}</p>
      </Card>

      <p className="mt-6 text-xs text-muted">
        {t.changePeriod} <code className="rounded bg-black/[.04] px-1 py-0.5 dark:bg-white/[.08]">?days=7</code>{' '}
        {t.changePeriodSuffix}
      </p>
    </div>
  );
}

function FunnelStep({
  label,
  value,
  max,
  detail,
  tone = 'default',
}: {
  label: string;
  value: number;
  max: number;
  detail?: string;
  tone?: 'default' | 'warning';
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-foreground">{label}</span>
        <span className="shrink-0 font-semibold tabular-nums text-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/[.05] dark:bg-white/[.08]">
        <div
          className={`h-full rounded-full transition-[width] ${
            tone === 'warning' ? 'bg-warning' : 'bg-primary'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {detail && <p className="mt-1 text-xs text-muted">{detail}</p>}
    </div>
  );
}
