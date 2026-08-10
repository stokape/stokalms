// ============================================================================
// reportes/page.tsx — Los 3 reportes del brief comercial: asistencia,
// notas y avance de matrícula (ver
// apps/api/src/modules/reports/reports.service.ts). Requiere "report:view"
// (Super Admin, Administrador de entidad, Coordinador académico, Docente,
// Auditor/Invitado — ver prisma/seed.js); exportar a CSV requiere además
// "report:export" (mismos roles) — el enlace de exportar se muestra igual
// para todos con "report:view" y, si no tienen permiso de exportar, el
// backend corta con 403 al hacer clic (ver reports.controller.ts):
// simplificación deliberada, mismos roles tienen ambos permisos hoy (ver
// seed.js) así que en la práctica nunca diverge.
//
// El reporte de notas es el ÚNICO que exige elegir un curso primero (la
// nota final se calcula curso por curso, ver gradebook.service.ts) — los
// otros dos son opcionalmente filtrables.
// ============================================================================

import Link from 'next/link';
import { requireAccessToken, apiFetch, getPermissions, can, toErrorMessage } from '@/lib/api';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { selectClasses } from '@/components/ui/field-styles';
import { getLocale } from '@/lib/locale';
import { crearReportePersonalizado, eliminarReportePersonalizado } from './actions';

const TEXT = {
  es: {
    title: 'Reportes',
    description: 'Resumen de asistencia, notas y avance de matrícula — exportables a CSV.',
    courseFilterLabel: 'Curso',
    allCourses: 'Todos los cursos',
    apply: 'Filtrar',
    exportCsv: 'Exportar CSV',
    attendance: 'Resumen de asistencia',
    student: 'Alumno',
    course: 'Curso',
    section: 'Sección',
    present: 'Presente',
    late: 'Tarde',
    absent: 'Ausente',
    excused: 'Justificado',
    rate: '% Asistencia',
    noAttendance: 'No hay matrículas para mostrar.',
    grades: 'Distribución de notas',
    pickCourseForGrades: 'Elige un curso arriba para ver su distribución de notas.',
    finalScore: 'Nota final',
    letterGrade: 'Letra',
    summaryStudents: 'Alumnos',
    summaryPassing: 'Aprobados',
    summaryFailing: 'Desaprobados',
    summaryAverage: 'Promedio',
    noScale: 'Este curso todavía no tiene una escala de notas configurada.',
    progress: 'Avance de matrícula',
    status: 'Estado',
    lessons: 'Lecciones',
    assessments: 'Evaluaciones',
    noProgress: 'No hay matrículas para mostrar.',
    // --- Analítica avanzada (plan Pro) ---
    trendTitle: 'Tendencia de finalización (últimos 6 meses)',
    trendMonth: 'Mes',
    trendEnrolled: 'Matriculados',
    trendCompleted: 'Completados a la fecha',
    trendRate: '% Finalización',
    trendNote: '"Completados a la fecha" cuenta cuántos de los matriculados ESE mes están completados hoy — no hay una fecha de finalización guardada, así que no se puede saber el día exacto en que terminaron.',
    noTrend: 'Todavía no hay matrículas en este período.',
    atRiskTitle: 'Alumnos en riesgo (14+ días sin actividad)',
    atRiskDays: (n: number) => `${n} días`,
    noAtRisk: 'Nadie en riesgo por ahora — todos con actividad reciente.',
    cohortCompareTitle: 'Comparar cohortes',
    cohortA: 'Cohorte A',
    cohortB: 'Cohorte B',
    pickCohort: 'Elige una cohorte',
    compare: 'Comparar',
    cohortMembers: 'Miembros',
    cohortEnrolled: 'Matriculados',
    cohortCompleted: 'Completados',
    cohortRate: '% Finalización',
    cohortAvgGrade: 'Nota promedio',
    pickBothCohorts: 'Elige dos cohortes arriba para compararlas.',
    // --- Exportación avanzada / BI (plan Enterprise) ---
    biTitle: 'Exportación avanzada (datos crudos para BI)',
    biDescription: 'Una fila por evento (no resumido) — pensado para conectar a tu propio Power BI/Tableau.',
    biEnrollments: 'Matrículas ↓',
    biSubmissions: 'Entregas ↓',
    biLessonViews: 'Vistas de lección ↓',
    // --- Reportes personalizados (plan Pro) ---
    customTitle: 'Reportes personalizados',
    customDescription: 'Elige qué columnas te importan de cada reporte y guárdalo con nombre para generarlo de nuevo cuando quieras.',
    customName: 'Nombre',
    customNamePlaceholder: 'Ej. "Notas para dirección"',
    customColumns: 'Columnas',
    customSave: 'Guardar',
    customSaved: 'Guardados',
    customNoneSaved: 'Todavía no guardaste ningún reporte personalizado.',
    customExport: 'Exportar CSV ↓',
    customDelete: 'Eliminar',
    customNeedsCourse: '(de notas — necesita el filtro de curso de arriba)',
  },
  en: {
    title: 'Reports',
    description: 'Attendance, grades, and enrollment-progress summaries — exportable to CSV.',
    courseFilterLabel: 'Course',
    allCourses: 'All courses',
    apply: 'Filter',
    exportCsv: 'Export CSV',
    attendance: 'Attendance summary',
    student: 'Student',
    course: 'Course',
    section: 'Section',
    present: 'Present',
    late: 'Late',
    absent: 'Absent',
    excused: 'Excused',
    rate: '% Attendance',
    noAttendance: 'No enrollments to show.',
    grades: 'Grade distribution',
    pickCourseForGrades: 'Pick a course above to see its grade distribution.',
    finalScore: 'Final score',
    letterGrade: 'Letter',
    summaryStudents: 'Students',
    summaryPassing: 'Passing',
    summaryFailing: 'Failing',
    summaryAverage: 'Average',
    noScale: "This course doesn't have a grading scale configured yet.",
    progress: 'Enrollment progress',
    status: 'Status',
    lessons: 'Lessons',
    assessments: 'Assessments',
    noProgress: 'No enrollments to show.',
    trendTitle: 'Completion trend (last 6 months)',
    trendMonth: 'Month',
    trendEnrolled: 'Enrolled',
    trendCompleted: 'Completed so far',
    trendRate: '% Completion',
    trendNote: '"Completed so far" counts how many of that month\'s enrollees are completed today — there\'s no stored completion date, so the exact day they finished isn\'t known.',
    noTrend: 'No enrollments in this period yet.',
    atRiskTitle: 'At-risk students (14+ days without activity)',
    atRiskDays: (n: number) => `${n} days`,
    noAtRisk: 'No one at risk right now — everyone has recent activity.',
    cohortCompareTitle: 'Compare cohorts',
    cohortA: 'Cohort A',
    cohortB: 'Cohort B',
    pickCohort: 'Pick a cohort',
    compare: 'Compare',
    cohortMembers: 'Members',
    cohortEnrolled: 'Enrolled',
    cohortCompleted: 'Completed',
    cohortRate: '% Completion',
    cohortAvgGrade: 'Average grade',
    pickBothCohorts: 'Pick two cohorts above to compare them.',
    biTitle: 'Advanced export (raw data for BI)',
    biDescription: "One row per event (not summarized) — meant to plug into your own Power BI/Tableau.",
    biEnrollments: 'Enrollments ↓',
    biSubmissions: 'Submissions ↓',
    biLessonViews: 'Lesson views ↓',
    customTitle: 'Custom reports',
    customDescription: 'Pick which columns matter to you from each report and save it by name to generate again later.',
    customName: 'Name',
    customNamePlaceholder: 'E.g. "Grades for leadership"',
    customColumns: 'Columns',
    customSave: 'Save',
    customSaved: 'Saved',
    customNoneSaved: "You haven't saved any custom report yet.",
    customExport: 'Export CSV ↓',
    customDelete: 'Delete',
    customNeedsCourse: '(grades — needs the course filter above)',
  },
};

interface Course {
  id: string;
  title: string;
}

interface AttendanceRow {
  enrollmentId: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  sectionName: string;
  present: number;
  late: number;
  absent: number;
  excused: number;
  attendanceRate: number | null;
}

interface ProgressRow {
  enrollmentId: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  sectionName: string;
  status: string;
  lessonsViewed: number;
  lessonsTotal: number;
  submissionsCount: number;
  assessmentsTotal: number;
}

interface GradesReport {
  courseTitle: string;
  warnings: string[];
  summary: { totalStudents: number; passing: number; failing: number; averageScore: number | null };
  results: Array<{
    student: { fullName: string; email: string };
    section: { name: string };
    finalScore: number;
    letterGrade: string | null;
  }>;
}

interface TrendPoint {
  month: string;
  enrolled: number;
  completedSoFar: number;
  completionRate: number | null;
}

interface AtRiskRow {
  enrollmentId: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  sectionName: string;
  daysInactive: number;
}

interface CohortSummary {
  cohortId: string;
  cohortName: string;
  memberCount: number;
  enrolledCount: number;
  completedCount: number;
  completionRate: number | null;
  averageGrade: number | null;
}

interface Cohort {
  id: string;
  name: string;
}

interface ReportPreset {
  id: string;
  name: string;
  reportType: 'attendance' | 'grades' | 'enrollment_progress';
  columns: string[];
}

// Mismo catálogo que REPORT_COLUMN_CATALOG en reports.service.ts (backend)
// — duplicado a propósito: es solo texto para armar el formulario, el
// backend es quien de verdad valida qué combinaciones son válidas.
const PRESET_COLUMNS: Record<ReportPreset['reportType'], Array<{ key: string; label: string }>> = {
  attendance: [
    { key: 'studentName', label: 'Alumno' },
    { key: 'studentEmail', label: 'Email' },
    { key: 'courseTitle', label: 'Curso' },
    { key: 'sectionName', label: 'Sección' },
    { key: 'present', label: 'Presente' },
    { key: 'late', label: 'Tarde' },
    { key: 'absent', label: 'Ausente' },
    { key: 'excused', label: 'Justificado' },
    { key: 'attendanceRate', label: '% Asistencia' },
  ],
  grades: [
    { key: 'studentName', label: 'Alumno' },
    { key: 'studentEmail', label: 'Email' },
    { key: 'sectionName', label: 'Sección' },
    { key: 'finalScore', label: 'Nota final' },
    { key: 'letterGrade', label: 'Letra' },
  ],
  enrollment_progress: [
    { key: 'studentName', label: 'Alumno' },
    { key: 'studentEmail', label: 'Email' },
    { key: 'courseTitle', label: 'Curso' },
    { key: 'sectionName', label: 'Sección' },
    { key: 'status', label: 'Estado' },
    { key: 'lessonsViewed', label: 'Lecciones vistas' },
    { key: 'lessonsTotal', label: 'Lecciones totales' },
    { key: 'submissionsCount', label: 'Evaluaciones entregadas' },
    { key: 'assessmentsTotal', label: 'Evaluaciones totales' },
  ],
};

const PRESET_TYPE_LABEL: Record<ReportPreset['reportType'], string> = {
  attendance: 'Asistencia',
  grades: 'Notas',
  enrollment_progress: 'Avance de matrícula',
};

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; error?: string; cohortA?: string; cohortB?: string }>;
}) {
  const { courseId, error, cohortA, cohortB } = await searchParams;
  const token = await requireAccessToken();
  const t = TEXT[await getLocale()];
  const qs = courseId ? `?courseId=${encodeURIComponent(courseId)}` : '';
  const permissions = await getPermissions(token);
  const canSeeCohorts = can(permissions, 'cohort', 'view');

  let courses: Course[];
  let attendance: AttendanceRow[];
  let progress: ProgressRow[];
  let trend: TrendPoint[];
  let atRisk: AtRiskRow[];
  let presets: ReportPreset[];
  try {
    [courses, attendance, progress, trend, atRisk, presets] = await Promise.all([
      apiFetch<Course[]>(token, '/courses'),
      apiFetch<AttendanceRow[]>(token, `/reports/attendance${qs}`),
      apiFetch<ProgressRow[]>(token, `/reports/enrollment-progress${qs}`),
      apiFetch<TrendPoint[]>(token, `/reports/analytics/trend${qs}`),
      apiFetch<AtRiskRow[]>(token, `/reports/analytics/at-risk${qs}`),
      apiFetch<ReportPreset[]>(token, '/reports/presets'),
    ]);
  } catch (err) {
    return <ErrorBanner message={toErrorMessage(err)} />;
  }

  let grades: GradesReport | null = null;
  let gradesError: string | null = null;
  if (courseId) {
    try {
      grades = await apiFetch<GradesReport>(token, `/reports/grades?courseId=${encodeURIComponent(courseId)}`);
    } catch (err) {
      gradesError = toErrorMessage(err);
    }
  }

  let cohorts: Cohort[] = [];
  if (canSeeCohorts) {
    try {
      cohorts = await apiFetch<Cohort[]>(token, '/cohorts');
    } catch {
      cohorts = [];
    }
  }

  let cohortComparison: { cohortA: CohortSummary; cohortB: CohortSummary } | null = null;
  if (canSeeCohorts && cohortA && cohortB) {
    try {
      cohortComparison = await apiFetch(
        token,
        `/reports/analytics/cohort-comparison?cohortAId=${encodeURIComponent(cohortA)}&cohortBId=${encodeURIComponent(cohortB)}${courseId ? `&courseId=${encodeURIComponent(courseId)}` : ''}`,
      );
    } catch {
      cohortComparison = null;
    }
  }

  return (
    <div>
      <PageHeader title={t.title} description={t.description} />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={decodeURIComponent(error)} />
        </div>
      )}

      <Card className="mb-8">
        <form className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-medium text-muted">{t.courseFilterLabel}</span>
            <select name="courseId" defaultValue={courseId ?? ''} className={`min-w-[220px] ${selectClasses}`}>
              <option value="">{t.allCourses}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-black/[.03] dark:hover:bg-white/[.06]"
          >
            {t.apply}
          </button>
        </form>
      </Card>

      {/* --- Asistencia --- */}
      <Section title={t.attendance} exportHref={`/reportes/export/attendance${qs}`} exportLabel={t.exportCsv}>
        {attendance.length === 0 ? (
          <p className="text-sm text-muted">{t.noAttendance}</p>
        ) : (
          <ReportTable
            headers={[t.student, t.course, t.section, t.present, t.late, t.absent, t.excused, t.rate]}
            rows={attendance.map((r) => [
              `${r.studentName} · ${r.studentEmail}`,
              r.courseTitle,
              r.sectionName,
              r.present,
              r.late,
              r.absent,
              r.excused,
              r.attendanceRate !== null ? `${r.attendanceRate}%` : '—',
            ])}
          />
        )}
      </Section>

      {/* --- Notas --- */}
      <Section
        title={t.grades}
        exportHref={courseId ? `/reportes/export/grades${qs}` : undefined}
        exportLabel={t.exportCsv}
      >
        {!courseId ? (
          <p className="text-sm text-muted">{t.pickCourseForGrades}</p>
        ) : gradesError ? (
          <p className="text-sm text-muted">{t.noScale}</p>
        ) : grades ? (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label={t.summaryStudents} value={grades.summary.totalStudents} />
              <MiniStat label={t.summaryPassing} value={grades.summary.passing} />
              <MiniStat label={t.summaryFailing} value={grades.summary.failing} />
              <MiniStat label={t.summaryAverage} value={grades.summary.averageScore ?? '—'} />
            </div>
            {grades.results.length === 0 ? (
              <p className="text-sm text-muted">{t.noAttendance}</p>
            ) : (
              <ReportTable
                headers={[t.student, t.section, t.finalScore, t.letterGrade]}
                rows={grades.results.map((r) => [
                  `${r.student.fullName} · ${r.student.email}`,
                  r.section.name,
                  r.finalScore,
                  r.letterGrade ?? '—',
                ])}
              />
            )}
          </>
        ) : null}
      </Section>

      {/* --- Avance de matrícula --- */}
      <Section
        title={t.progress}
        exportHref={`/reportes/export/enrollment-progress${qs}`}
        exportLabel={t.exportCsv}
      >
        {progress.length === 0 ? (
          <p className="text-sm text-muted">{t.noProgress}</p>
        ) : (
          <ReportTable
            headers={[t.student, t.course, t.section, t.status, t.lessons, t.assessments]}
            rows={progress.map((r) => [
              `${r.studentName} · ${r.studentEmail}`,
              r.courseTitle,
              r.sectionName,
              r.status,
              `${r.lessonsViewed}/${r.lessonsTotal}`,
              `${r.submissionsCount}/${r.assessmentsTotal}`,
            ])}
          />
        )}
      </Section>

      {/* --- Analítica avanzada (plan Pro) --- */}
      <Section title={t.trendTitle}>
        {trend.length === 0 ? (
          <p className="text-sm text-muted">{t.noTrend}</p>
        ) : (
          <>
            <ReportTable
              headers={[t.trendMonth, t.trendEnrolled, t.trendCompleted, t.trendRate]}
              rows={trend.map((p) => [
                p.month,
                p.enrolled,
                p.completedSoFar,
                p.completionRate !== null ? `${p.completionRate}%` : '—',
              ])}
            />
            <p className="mt-3 text-xs text-muted">{t.trendNote}</p>
          </>
        )}
      </Section>

      <Section title={t.atRiskTitle}>
        {atRisk.length === 0 ? (
          <p className="text-sm text-muted">{t.noAtRisk}</p>
        ) : (
          <ReportTable
            headers={[t.student, t.course, t.section, t.status]}
            rows={atRisk.map((r) => [
              `${r.studentName} · ${r.studentEmail}`,
              r.courseTitle,
              r.sectionName,
              <Badge key={r.enrollmentId} tone={r.daysInactive >= 21 ? 'danger' : 'warning'}>
                {t.atRiskDays(r.daysInactive)}
              </Badge>,
            ])}
          />
        )}
      </Section>

      {canSeeCohorts && (
        <Section title={t.cohortCompareTitle}>
          <form className="mb-4 flex flex-wrap items-end gap-3">
            {courseId && <input type="hidden" name="courseId" value={courseId} />}
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-medium text-muted">{t.cohortA}</span>
              <select name="cohortA" defaultValue={cohortA ?? ''} className={`min-w-[180px] ${selectClasses}`}>
                <option value="">{t.pickCohort}</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-medium text-muted">{t.cohortB}</span>
              <select name="cohortB" defaultValue={cohortB ?? ''} className={`min-w-[180px] ${selectClasses}`}>
                <option value="">{t.pickCohort}</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-black/[.03] dark:hover:bg-white/[.06]"
            >
              {t.compare}
            </button>
          </form>

          {!cohortComparison ? (
            <p className="text-sm text-muted">{t.pickBothCohorts}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CohortCard summary={cohortComparison.cohortA} t={t} />
              <CohortCard summary={cohortComparison.cohortB} t={t} />
            </div>
          )}
        </Section>
      )}

      {/* --- Exportación avanzada / BI (plan Enterprise) --- */}
      <Section title={t.biTitle}>
        <p className="mb-4 text-sm text-muted">{t.biDescription}</p>
        <div className="flex flex-wrap gap-4 text-sm font-medium text-primary">
          <Link href={`/reportes/export/raw-enrollments${qs}`} className="hover:underline">
            {t.biEnrollments}
          </Link>
          <Link href={`/reportes/export/raw-submissions${qs}`} className="hover:underline">
            {t.biSubmissions}
          </Link>
          <Link href={`/reportes/export/raw-lesson-views${qs}`} className="hover:underline">
            {t.biLessonViews}
          </Link>
        </div>
      </Section>

      {/* --- Reportes personalizados (plan Pro) --- */}
      <div className="mb-10">
        <h2 className="mb-3 text-base font-medium">{t.customTitle}</h2>
        <p className="mb-4 text-sm text-muted">{t.customDescription}</p>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {(Object.keys(PRESET_COLUMNS) as Array<ReportPreset['reportType']>).map((reportType) => (
            <Card key={reportType}>
              <h3 className="mb-1 text-sm font-semibold">{PRESET_TYPE_LABEL[reportType]}</h3>
              {reportType === 'grades' && <p className="mb-2 text-xs text-muted">{t.customNeedsCourse}</p>}
              <form action={crearReportePersonalizado} className="flex flex-col gap-3">
                <input type="hidden" name="reportType" value={reportType} />
                <input
                  name="name"
                  placeholder={t.customNamePlaceholder}
                  required
                  className="rounded-lg border border-border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary"
                />
                <fieldset className="flex flex-col gap-1.5">
                  <legend className="mb-1 text-xs font-medium text-muted">{t.customColumns}</legend>
                  {PRESET_COLUMNS[reportType].map((col) => (
                    <label key={col.key} className="flex items-center gap-2 text-xs">
                      <input type="checkbox" name="columns" value={col.key} className="h-3.5 w-3.5" />
                      {col.label}
                    </label>
                  ))}
                </fieldset>
                <Button type="submit" variant="secondary" size="sm" className="self-start">
                  {t.customSave}
                </Button>
              </form>
            </Card>
          ))}
        </div>

        <h3 className="mb-2 text-sm font-medium text-muted">{t.customSaved}</h3>
        {presets.length === 0 ? (
          <p className="text-sm text-muted">{t.customNoneSaved}</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {presets.map((preset) => {
              const exportQs =
                preset.reportType === 'grades' && courseId
                  ? `?presetId=${preset.id}&courseId=${encodeURIComponent(courseId)}`
                  : `?presetId=${preset.id}`;
              return (
                <li key={preset.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{preset.name}</p>
                    <p className="text-xs text-muted">
                      {PRESET_TYPE_LABEL[preset.reportType]} · {preset.columns.length} columnas
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Link href={`/reportes/export/custom${exportQs}`} className="text-xs font-medium text-primary hover:underline">
                      {t.customExport}
                    </Link>
                    <form action={eliminarReportePersonalizado.bind(null, preset.id)}>
                      <button type="submit" className="text-xs font-medium text-danger hover:underline">
                        {t.customDelete}
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function CohortCard({ summary, t }: { summary: CohortSummary; t: (typeof TEXT)['es'] }) {
  return (
    <div className="rounded-lg border border-border bg-black/[.015] p-4 dark:bg-white/[.02]">
      <p className="mb-3 text-sm font-semibold">{summary.cohortName}</p>
      <div className="grid grid-cols-2 gap-3">
        <MiniStat label={t.cohortMembers} value={summary.memberCount} />
        <MiniStat label={t.cohortEnrolled} value={summary.enrolledCount} />
        <MiniStat label={t.cohortCompleted} value={summary.completedCount} />
        <MiniStat label={t.cohortRate} value={summary.completionRate !== null ? `${summary.completionRate}%` : '—'} />
        {summary.averageGrade !== null && (
          <MiniStat label={t.cohortAvgGrade} value={summary.averageGrade} />
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  exportHref,
  exportLabel,
  children,
}: {
  title: string;
  exportHref?: string;
  exportLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-medium">{title}</h2>
        {exportHref && (
          <Link href={exportHref} className="text-sm font-medium text-primary hover:underline">
            {exportLabel} ↓
          </Link>
        )}
      </div>
      <Card>{children}</Card>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-black/[.015] p-3 dark:bg-white/[.02]">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function ReportTable({ headers, rows }: { headers: string[]; rows: Array<Array<React.ReactNode>> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-b-0">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
