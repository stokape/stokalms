// ============================================================================
// panel/page.tsx — "Panel": números agregados sobre datos que ya existen
// (ver apps/api/src/modules/dashboard/dashboard.service.ts) — cursos
// activos, matrículas, asistencia, certificados emitidos, entregas
// pendientes de corregir. Requiere "dashboard:view" (Super Admin,
// Administrador de entidad, Coordinador académico, Docente, Auditor/
// Invitado — ver prisma/seed.js); cualquier otro rol ve el mensaje de "no
// tienes permiso" habitual.
//
// Los widgets "empresariales" (abajo, sección aparte) solo se piden si la
// sesión tiene "tenant:edit" — mismo permiso exclusivo de Super Admin/
// Administrador de entidad que ya gatea marca/dominios/mantenimiento.
// ============================================================================

import { requireAccessToken, apiFetch, getPermissions, can, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { HorizontalBars } from '@/components/ui/charts/HorizontalBars';
import { GroupedColumns } from '@/components/ui/charts/GroupedColumns';
import { getLocale } from '@/lib/locale';

const TEXT = {
  es: {
    title: 'Panel',
    description: 'Un vistazo rápido al estado de tu institución.',
    activeCourses: 'Cursos activos',
    activeEnrollments: 'Matrículas activas',
    completedEnrollments: 'Matrículas completadas',
    attendanceRate: 'Asistencia (últimos 30 días)',
    noAttendanceYet: 'Sin registros todavía',
    certificatesIssued: 'Certificados emitidos (30 días)',
    pendingGrading: 'Entregas por corregir',
    enterpriseHeading: 'Vista empresarial',
    topCourses: 'Cursos con más matrículas activas',
    noCourses: 'Todavía no hay matrículas activas.',
    cohorts: 'Alumnos por cohorte',
    noCohorts: 'Todavía no creaste ninguna cohorte.',
    enrollmentTrend: 'Matrículas nuevas',
    last30: 'Últimos 30 días',
    previous30: '30 días anteriores',
    lastUpdated: (time: string) => `Actualizado recién · ${time}`,
  },
  en: {
    title: 'Panel',
    description: "A quick look at your institution's status.",
    activeCourses: 'Active courses',
    activeEnrollments: 'Active enrollments',
    completedEnrollments: 'Completed enrollments',
    attendanceRate: 'Attendance (last 30 days)',
    noAttendanceYet: 'No records yet',
    certificatesIssued: 'Certificates issued (30 days)',
    pendingGrading: 'Submissions to grade',
    enterpriseHeading: 'Enterprise view',
    topCourses: 'Courses with the most active enrollments',
    noCourses: 'No active enrollments yet.',
    cohorts: 'Students per cohort',
    noCohorts: "You haven't created any cohorts yet.",
    enrollmentTrend: 'New enrollments',
    last30: 'Last 30 days',
    previous30: 'Previous 30 days',
    lastUpdated: (time: string) => `Updated just now · ${time}`,
  },
};

interface Summary {
  activeCourses: number;
  activeEnrollments: number;
  completedEnrollments: number;
  attendanceRate30d: number | null;
  certificatesIssued30d: number;
  submissionsPendingGrading: number;
}

interface EnterpriseSummary {
  topCourses: Array<{ sectionId: string; sectionName: string; courseTitle: string; activeEnrollments: number }>;
  cohortBreakdown: Array<{ cohortId: string; name: string; memberCount: number }>;
  enrollmentTrend: { last30Days: number; previous30Days: number };
}

export default async function PanelPage() {
  const token = await requireAccessToken();
  const locale = await getLocale();
  const t = TEXT[locale];
  // Esta pantalla se renderiza de nuevo en CADA visita (sin cache, ver
  // apiFetch en lib/api.ts) — la hora de este render ES la hora real de
  // los datos que se ven abajo, no hace falta guardar un timestamp aparte.
  const updatedAt = new Date().toLocaleTimeString(locale === 'en' ? 'en-US' : 'es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const permissions = await getPermissions(token);
  const canSeeEnterprise = can(permissions, 'tenant', 'edit');

  let summary: Summary;
  try {
    summary = await apiFetch<Summary>(token, '/dashboard/summary');
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  let enterprise: EnterpriseSummary | null = null;
  if (canSeeEnterprise) {
    try {
      enterprise = await apiFetch<EnterpriseSummary>(token, '/dashboard/enterprise-summary');
    } catch {
      enterprise = null;
    }
  }

  return (
    <div>
      <PageHeader
        title={t.title}
        description={t.description}
        actions={<p className="text-xs text-muted">{t.lastUpdated(updatedAt)}</p>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label={t.activeCourses} value={summary.activeCourses} />
        <StatCard label={t.activeEnrollments} value={summary.activeEnrollments} />
        <StatCard label={t.completedEnrollments} value={summary.completedEnrollments} />
        <StatCard
          label={t.attendanceRate}
          value={summary.attendanceRate30d !== null ? `${summary.attendanceRate30d}%` : t.noAttendanceYet}
        />
        <StatCard label={t.certificatesIssued} value={summary.certificatesIssued30d} />
        <StatCard label={t.pendingGrading} value={summary.submissionsPendingGrading} />
      </div>

      {enterprise && (
        <div className="mt-10">
          <h2 className="mb-4 text-base font-medium">{t.enterpriseHeading}</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <h3 className="mb-3 text-sm font-semibold">{t.topCourses}</h3>
              {enterprise.topCourses.length === 0 ? (
                <p className="text-sm text-muted">{t.noCourses}</p>
              ) : (
                <HorizontalBars
                  data={enterprise.topCourses.map((c) => ({
                    key: c.sectionId,
                    label: `${c.courseTitle} · ${c.sectionName}`,
                    value: c.activeEnrollments,
                  }))}
                />
              )}
            </Card>

            <Card>
              <h3 className="mb-3 text-sm font-semibold">{t.cohorts}</h3>
              {enterprise.cohortBreakdown.length === 0 ? (
                <p className="text-sm text-muted">{t.noCohorts}</p>
              ) : (
                <HorizontalBars
                  data={enterprise.cohortBreakdown.map((c) => ({ key: c.cohortId, label: c.name, value: c.memberCount }))}
                />
              )}
            </Card>

            <Card>
              <h3 className="mb-3 text-sm font-semibold">{t.enrollmentTrend}</h3>
              <GroupedColumns
                data={[
                  { key: 'last30', category: t.last30, values: { count: enterprise.enrollmentTrend.last30Days } },
                  { key: 'previous30', category: t.previous30, values: { count: enterprise.enrollmentTrend.previous30Days } },
                ]}
                series={[{ key: 'count', label: t.enrollmentTrend, color: 'var(--chart-1)' }]}
                height={120}
              />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}
