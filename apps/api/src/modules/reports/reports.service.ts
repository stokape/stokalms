// ============================================================================
// reports.service.ts — Los 3 reportes de app/reportes/ (ver
// docs de la conversacion comercial: "resumen de asistencia",
// "distribucion de notas", "avance de matricula"). Cada uno es una
// AGREGACION de datos que ya existen (AttendanceRecord, Grade via
// GradebookService, LessonView/Submission) — mismo criterio que
// dashboard.service.ts y academic-progress.service.ts: sin tabla de
// "reportes" propia, todo se calcula al vuelo.
// ============================================================================

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { GradebookService } from '../gradebook/gradebook.service';
import { toCsv } from '../../common/csv/csv.util';
import { REPORT_PRESET_TYPES } from './dto/report-preset.dto';

export interface AttendanceReportRow {
  enrollmentId: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  sectionName: string;
  present: number;
  late: number;
  absent: number;
  excused: number;
  totalSessions: number;
  attendanceRate: number | null;
}

export interface EnrollmentProgressRow {
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

export interface CompletionTrendPoint {
  month: string; // "YYYY-MM"
  enrolled: number;
  // Cuantos de los matriculados ESE mes estan "completed" HOY (a la fecha
  // de la consulta) — no "cuantos completaron durante ese mes": Enrollment
  // no guarda una fecha de finalizacion (ver schema.prisma), solo el
  // estado actual. Es la aproximacion mas honesta posible con el dato que
  // existe, y se etiqueta como tal en el frontend.
  completedSoFar: number;
  completionRate: number | null;
}

export interface AtRiskStudentRow {
  enrollmentId: string;
  courseId: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  sectionName: string;
  lastActivityAt: string;
  daysInactive: number;
}

export interface CohortComparisonSide {
  cohortId: string;
  cohortName: string;
  memberCount: number;
  enrolledCount: number;
  completedCount: number;
  completionRate: number | null;
  averageGrade: number | null;
}

// "Reportes personalizados" (ver report-preset.dto.ts): que columnas
// existen para cada uno de los 3 reportes de siempre, y de donde sale cada
// valor — SIEMPRE proyectando sobre las filas que YA calculan
// getAttendanceReport/getGradesReport/getEnrollmentProgressReport, nunca
// una fuente de datos nueva.
const REPORT_COLUMN_CATALOG: Record<(typeof REPORT_PRESET_TYPES)[number], Array<{ key: string; header: string }>> = {
  attendance: [
    { key: 'studentName', header: 'Alumno' },
    { key: 'studentEmail', header: 'Email' },
    { key: 'courseTitle', header: 'Curso' },
    { key: 'sectionName', header: 'Sección' },
    { key: 'present', header: 'Presente' },
    { key: 'late', header: 'Tarde' },
    { key: 'absent', header: 'Ausente' },
    { key: 'excused', header: 'Justificado' },
    { key: 'attendanceRate', header: '% Asistencia' },
  ],
  grades: [
    { key: 'studentName', header: 'Alumno' },
    { key: 'studentEmail', header: 'Email' },
    { key: 'sectionName', header: 'Sección' },
    { key: 'finalScore', header: 'Nota final' },
    { key: 'letterGrade', header: 'Letra' },
  ],
  enrollment_progress: [
    { key: 'studentName', header: 'Alumno' },
    { key: 'studentEmail', header: 'Email' },
    { key: 'courseTitle', header: 'Curso' },
    { key: 'sectionName', header: 'Sección' },
    { key: 'status', header: 'Estado' },
    { key: 'lessonsViewed', header: 'Lecciones vistas' },
    { key: 'lessonsTotal', header: 'Lecciones totales' },
    { key: 'submissionsCount', header: 'Evaluaciones entregadas' },
    { key: 'assessmentsTotal', header: 'Evaluaciones totales' },
  ],
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly gradebookService: GradebookService,
  ) {}

  // --- Resumen de asistencia, por matricula ------------------------------

  async getAttendanceReport(courseId?: string): Promise<AttendanceReportRow[]> {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const enrollments = await tx.enrollment.findMany({
        where: courseId ? { section: { courseId } } : undefined,
        include: {
          userTenant: { include: { user: true } },
          section: { include: { course: true } },
          attendanceRecords: { select: { status: true } },
        },
        orderBy: { userTenant: { user: { fullName: 'asc' } } },
      });

      return enrollments.map((e) => {
        const records = e.attendanceRecords;
        const present = records.filter((r) => r.status === 'present').length;
        const late = records.filter((r) => r.status === 'late').length;
        const absent = records.filter((r) => r.status === 'absent').length;
        const excused = records.filter((r) => r.status === 'excused').length;
        const totalSessions = records.length;

        return {
          enrollmentId: e.id,
          studentName: e.userTenant.user.fullName,
          studentEmail: e.userTenant.user.email,
          courseTitle: e.section.course.title,
          sectionName: e.section.name,
          present,
          late,
          absent,
          excused,
          totalSessions,
          attendanceRate: totalSessions > 0 ? Math.round(((present + late) / totalSessions) * 100) : null,
        };
      });
    });
  }

  // Encabezados SIEMPRE en español, igual que cualquier otro mensaje que
  // arma el backend (ver la nota en dictionaries/registro-institucion.ts:
  // "vienen generados del lado del servidor, siempre en español" —
  // traducir el backend entero queda fuera de alcance).
  async getAttendanceReportCsv(courseId: string | undefined): Promise<string> {
    const rows = await this.getAttendanceReport(courseId);
    return toCsv(rows, [
      { key: 'studentName', header: 'Alumno' },
      { key: 'studentEmail', header: 'Email' },
      { key: 'courseTitle', header: 'Curso' },
      { key: 'sectionName', header: 'Sección' },
      { key: 'present', header: 'Presente' },
      { key: 'late', header: 'Tarde' },
      { key: 'absent', header: 'Ausente' },
      { key: 'excused', header: 'Justificado' },
      { key: 'attendanceRate', header: '% Asistencia' },
    ]);
  }

  // --- Distribucion de notas, por curso -----------------------------------
  // Reusa TAL CUAL el algoritmo de nota final de gradebook.service.ts — un
  // reporte no puede calcular la nota de un curso "distinto" a como la ve
  // el propio curso (ver la nota extensa alli sobre por que la nota final
  // nunca se guarda aparte).

  async getGradesReport(courseId: string) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const course = await tx.course.findUnique({ where: { id: courseId } });
      if (!course) {
        throw new NotFoundException(`No existe el curso "${courseId}".`);
      }

      const { results, warnings } = await this.gradebookService.computeCourseGrades(
        tx as unknown as Prisma.TransactionClient,
        courseId,
        { onlyPublished: false },
      );

      // Distribucion por banda (aprobado/desaprobado) ademas del detalle
      // fila por fila — el "resumen" es lo primero que alguien mirando el
      // reporte quiere ver, el detalle es para exportar/auditar.
      const passingResults = results.filter((r) => (r.letterGrade ?? '').toUpperCase() !== 'F');
      const average = results.length > 0 ? results.reduce((sum, r) => sum + r.finalScore, 0) / results.length : null;

      return {
        courseTitle: course.title,
        warnings,
        summary: {
          totalStudents: results.length,
          passing: passingResults.length,
          failing: results.length - passingResults.length,
          averageScore: average !== null ? Math.round(average * 100) / 100 : null,
        },
        results,
      };
    });
  }

  async getGradesReportCsv(courseId: string): Promise<string> {
    const { results } = await this.getGradesReport(courseId);
    return toCsv(
      results.map((r) => ({
        studentName: r.student.fullName,
        studentEmail: r.student.email,
        sectionName: r.section.name,
        finalScore: r.finalScore,
        letterGrade: r.letterGrade ?? '',
      })),
      [
        { key: 'studentName', header: 'Alumno' },
        { key: 'studentEmail', header: 'Email' },
        { key: 'sectionName', header: 'Sección' },
        { key: 'finalScore', header: 'Nota final' },
        { key: 'letterGrade', header: 'Letra' },
      ],
    );
  }

  // --- Avance de matricula ------------------------------------------------

  async getEnrollmentProgressReport(courseId?: string): Promise<EnrollmentProgressRow[]> {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const enrollments = await tx.enrollment.findMany({
        where: courseId ? { section: { courseId } } : undefined,
        include: {
          userTenant: { include: { user: true } },
          section: { include: { course: true } },
        },
        orderBy: { userTenant: { user: { fullName: 'asc' } } },
      });

      // Se resuelven "lecciones totales"/"evaluaciones totales" UNA vez por
      // curso (no una vez por matricula) — varias matriculas comparten el
      // mismo curso, y esos totales no cambian entre ellas.
      const courseIds = [...new Set(enrollments.map((e) => e.section.courseId))];
      const assessmentTotals = await tx.assessment.groupBy({
        by: ['courseId'],
        where: { courseId: { in: courseIds } },
        _count: { _all: true },
      });
      // "lesson" se agrupa por modulo, no por curso directamente (no tiene
      // courseId propio) — se resuelve el total POR CURSO contando lecciones
      // de TODOS sus modulos, un curso a la vez (la lista de cursos
      // involucrados en un reporte es chica, no vale la pena una consulta
      // mas compleja para ahorrar un puñado de round-trips).
      const lessonsTotalByCourse = new Map<string, number>();
      for (const courseId of courseIds) {
        lessonsTotalByCourse.set(
          courseId,
          await tx.lesson.count({ where: { module: { courseId } } }),
        );
      }
      const assessmentsTotalByCourse = new Map(assessmentTotals.map((a) => [a.courseId, a._count._all]));

      const enrollmentIds = enrollments.map((e) => e.id);
      const [lessonViewCounts, submissionCounts] = await Promise.all([
        tx.lessonView.groupBy({ by: ['enrollmentId'], where: { enrollmentId: { in: enrollmentIds } }, _count: { _all: true } }),
        tx.submission.groupBy({
          by: ['enrollmentId'],
          where: { enrollmentId: { in: enrollmentIds }, status: { not: 'in_progress' } },
          _count: { _all: true },
        }),
      ]);
      const lessonViewsByEnrollment = new Map(lessonViewCounts.map((r) => [r.enrollmentId, r._count._all]));
      const submissionsByEnrollment = new Map(submissionCounts.map((r) => [r.enrollmentId, r._count._all]));

      return enrollments.map((e) => ({
        enrollmentId: e.id,
        studentName: e.userTenant.user.fullName,
        studentEmail: e.userTenant.user.email,
        courseTitle: e.section.course.title,
        sectionName: e.section.name,
        status: e.status,
        lessonsViewed: lessonViewsByEnrollment.get(e.id) ?? 0,
        lessonsTotal: lessonsTotalByCourse.get(e.section.courseId) ?? 0,
        submissionsCount: submissionsByEnrollment.get(e.id) ?? 0,
        assessmentsTotal: assessmentsTotalByCourse.get(e.section.courseId) ?? 0,
      }));
    });
  }

  async getEnrollmentProgressReportCsv(courseId: string | undefined): Promise<string> {
    const rows = await this.getEnrollmentProgressReport(courseId);
    return toCsv(rows, [
      { key: 'studentName', header: 'Alumno' },
      { key: 'studentEmail', header: 'Email' },
      { key: 'courseTitle', header: 'Curso' },
      { key: 'sectionName', header: 'Sección' },
      { key: 'status', header: 'Estado' },
      { key: 'lessonsViewed', header: 'Lecciones vistas' },
      { key: 'lessonsTotal', header: 'Lecciones totales' },
      { key: 'submissionsCount', header: 'Evaluaciones entregadas' },
      { key: 'assessmentsTotal', header: 'Evaluaciones totales' },
    ]);
  }

  // ==========================================================================
  // ANALÍTICA AVANZADA (plan Pro, ver lib/pricing.ts) — tendencia de
  // finalización, alumnos en riesgo, comparación entre cohortes. Los 3
  // reusan datos que ya existen (Enrollment, LessonView, Submission,
  // Cohort), nunca una tabla nueva — mismo criterio que el resto de este
  // archivo.
  // ==========================================================================

  async getCompletionTrend(courseId: string | undefined, months = 6): Promise<CompletionTrendPoint[]> {
    const tenantId = this.tenantContext.requireTenantId();
    const safeMonths = Math.min(Math.max(months, 1), 24);

    return this.prisma.withTenant(tenantId, async (tx) => {
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      since.setDate(1);
      since.setMonth(since.getMonth() - (safeMonths - 1));

      const enrollments = await tx.enrollment.findMany({
        where: { enrolledAt: { gte: since }, ...(courseId ? { section: { courseId } } : {}) },
        select: { enrolledAt: true, status: true },
      });

      const buckets = new Map<string, { enrolled: number; completedSoFar: number }>();
      for (let i = 0; i < safeMonths; i++) {
        const d = new Date(since);
        d.setMonth(d.getMonth() + i);
        buckets.set(monthKey(d), { enrolled: 0, completedSoFar: 0 });
      }
      for (const e of enrollments) {
        const bucket = buckets.get(monthKey(e.enrolledAt));
        if (!bucket) continue;
        bucket.enrolled++;
        if (e.status === 'completed') bucket.completedSoFar++;
      }

      return [...buckets.entries()].map(([month, b]) => ({
        month,
        enrolled: b.enrolled,
        completedSoFar: b.completedSoFar,
        completionRate: b.enrolled > 0 ? Math.round((b.completedSoFar / b.enrolled) * 100) : null,
      }));
    });
  }

  // "En riesgo" = matricula ACTIVA sin ninguna actividad (ni vio una
  // leccion, ni entrego nada) en los ultimos "inactivityDays" — misma
  // heuristica simple que usa la automatizacion de alertas de inactividad
  // (ver automations.service.ts, "sendInactivityAlerts"/"sendAtRiskDigest"),
  // que de hecho REUSA "getAtRiskStudentsForTenant" (version explicita, ver
  // abajo) para armar el resumen semanal — un job de fondo no tiene ningun
  // request activo del que "tenantContext.requireTenantId()" pueda leer,
  // mismo motivo del split "ParaTenant" que ya usa tenant.service.ts.
  async getAtRiskStudents(courseId: string | undefined, inactivityDays = 14): Promise<AtRiskStudentRow[]> {
    return this.getAtRiskStudentsForTenant(this.tenantContext.requireTenantId(), courseId, inactivityDays);
  }

  async getAtRiskStudentsForTenant(
    tenantId: string,
    courseId: string | undefined,
    inactivityDays = 14,
  ): Promise<AtRiskStudentRow[]> {
    return this.prisma.withTenant(tenantId, async (tx) => {
      const enrollments = await tx.enrollment.findMany({
        where: { status: 'active', ...(courseId ? { section: { courseId } } : {}) },
        include: { userTenant: { include: { user: true } }, section: { include: { course: true } } },
      });
      if (enrollments.length === 0) return [];

      const enrollmentIds = enrollments.map((e) => e.id);
      const [lastViews, lastSubmissions] = await Promise.all([
        tx.lessonView.groupBy({ by: ['enrollmentId'], where: { enrollmentId: { in: enrollmentIds } }, _max: { firstViewedAt: true } }),
        tx.submission.groupBy({ by: ['enrollmentId'], where: { enrollmentId: { in: enrollmentIds } }, _max: { submittedAt: true } }),
      ]);
      const lastViewByEnrollment = new Map(lastViews.map((r) => [r.enrollmentId, r._max.firstViewedAt]));
      const lastSubmissionByEnrollment = new Map(lastSubmissions.map((r) => [r.enrollmentId, r._max.submittedAt]));

      const now = Date.now();
      const threshold = inactivityDays * 24 * 60 * 60 * 1000;
      const results: AtRiskStudentRow[] = [];

      for (const e of enrollments) {
        const candidates = [lastViewByEnrollment.get(e.id), lastSubmissionByEnrollment.get(e.id), e.enrolledAt].filter(
          (d): d is Date => d != null,
        );
        const lastActivity = new Date(Math.max(...candidates.map((d) => d.getTime())));
        const inactiveMs = now - lastActivity.getTime();
        if (inactiveMs >= threshold) {
          results.push({
            enrollmentId: e.id,
            courseId: e.section.courseId,
            studentName: e.userTenant.user.fullName,
            studentEmail: e.userTenant.user.email,
            courseTitle: e.section.course.title,
            sectionName: e.section.name,
            lastActivityAt: lastActivity.toISOString(),
            daysInactive: Math.floor(inactiveMs / (24 * 60 * 60 * 1000)),
          });
        }
      }

      return results.sort((a, b) => b.daysInactive - a.daysInactive);
    });
  }

  async compareCohorts(
    cohortAId: string,
    cohortBId: string,
    courseId: string | undefined,
  ): Promise<{ cohortA: CohortComparisonSide; cohortB: CohortComparisonSide }> {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const summarize = async (cohortId: string): Promise<CohortComparisonSide> => {
        const cohort = await tx.cohort.findUnique({ where: { id: cohortId } });
        if (!cohort) {
          throw new NotFoundException(`No existe la cohorte "${cohortId}".`);
        }
        const members = await tx.userTenant.findMany({ where: { cohortId }, select: { id: true, userId: true } });
        const memberUserTenantIds = members.map((m) => m.id);

        const enrollments = memberUserTenantIds.length
          ? await tx.enrollment.findMany({
              where: {
                userTenantId: { in: memberUserTenantIds },
                ...(courseId ? { section: { courseId } } : {}),
              },
              select: { status: true },
            })
          : [];
        const completedCount = enrollments.filter((e) => e.status === 'completed').length;

        let averageGrade: number | null = null;
        if (courseId && members.length > 0) {
          const memberUserIds = new Set(members.map((m) => m.userId));
          const { results } = await this.gradebookService.computeCourseGrades(
            tx as unknown as Prisma.TransactionClient,
            courseId,
            { onlyPublished: false },
          );
          const relevant = results.filter((r) => memberUserIds.has(r.student.userId));
          if (relevant.length > 0) {
            averageGrade =
              Math.round((relevant.reduce((sum, r) => sum + r.finalScore, 0) / relevant.length) * 100) / 100;
          }
        }

        return {
          cohortId: cohort.id,
          cohortName: cohort.name,
          memberCount: members.length,
          enrolledCount: enrollments.length,
          completedCount,
          completionRate: enrollments.length > 0 ? Math.round((completedCount / enrollments.length) * 100) : null,
          averageGrade,
        };
      };

      const [cohortA, cohortB] = await Promise.all([summarize(cohortAId), summarize(cohortBId)]);
      return { cohortA, cohortB };
    });
  }

  // ==========================================================================
  // "ANALÍTICA EMPRESARIAL" (plan Enterprise, ver lib/pricing.ts): export
  // de datos CRUDOS (sin agregar), pensado para que el cliente lo enchufe
  // a su propio Power BI/Tableau — a diferencia de los 3 reportes de
  // arriba (que ya vienen resumidos por matricula), esto entrega UNA FILA
  // POR EVENTO. Alcance de UN tenant (ver la decision registrada en la
  // conversacion sobre por que no hay comparacion cross-tenant todavia:
  // no existe ningun modelo de "organizacion" que agrupe varios tenants).
  // ==========================================================================

  async getRawEnrollmentsCsv(courseId?: string): Promise<string> {
    const tenantId = this.tenantContext.requireTenantId();
    const rows = await this.prisma.withTenant(tenantId, (tx) =>
      tx.enrollment.findMany({
        where: courseId ? { section: { courseId } } : undefined,
        include: { userTenant: { include: { user: true } }, section: { include: { course: true } } },
        orderBy: { enrolledAt: 'asc' },
      }),
    );
    return toCsv(
      rows.map((e) => ({
        id: e.id,
        studentEmail: e.userTenant.user.email,
        studentName: e.userTenant.user.fullName,
        courseTitle: e.section.course.title,
        sectionName: e.section.name,
        status: e.status,
        enrolledAt: e.enrolledAt.toISOString(),
      })),
      [
        { key: 'id', header: 'ID matrícula' },
        { key: 'studentEmail', header: 'Email' },
        { key: 'studentName', header: 'Alumno' },
        { key: 'courseTitle', header: 'Curso' },
        { key: 'sectionName', header: 'Sección' },
        { key: 'status', header: 'Estado' },
        { key: 'enrolledAt', header: 'Fecha de matrícula' },
      ],
    );
  }

  async getRawSubmissionsCsv(courseId?: string): Promise<string> {
    const tenantId = this.tenantContext.requireTenantId();
    const rows = await this.prisma.withTenant(tenantId, (tx) =>
      tx.submission.findMany({
        where: courseId ? { assessment: { courseId } } : undefined,
        include: {
          // Assessment no tiene un "titulo" propio (ver schema.prisma,
          // modelo Assessment) — se identifica por su TIPO + la categoria
          // de gradebook a la que pertenece, mismo criterio que usa el
          // frontend para mostrarla (ver evaluaciones/page.tsx).
          assessment: { include: { course: true, gradebookCategory: true } },
          enrollment: { include: { userTenant: { include: { user: true } } } },
          grade: true,
        },
        orderBy: { submittedAt: 'asc' },
      }),
    );
    return toCsv(
      rows.map((s) => ({
        id: s.id,
        studentEmail: s.enrollment.userTenant.user.email,
        courseTitle: s.assessment.course.title,
        assessmentType: s.assessment.type,
        categoryName: s.assessment.gradebookCategory.name,
        attemptNumber: s.attemptNumber,
        status: s.status,
        grade: s.grade?.finalScore ?? '',
        submittedAt: s.submittedAt.toISOString(),
      })),
      [
        { key: 'id', header: 'ID entrega' },
        { key: 'studentEmail', header: 'Email' },
        { key: 'courseTitle', header: 'Curso' },
        { key: 'assessmentType', header: 'Tipo de evaluación' },
        { key: 'categoryName', header: 'Categoría' },
        { key: 'attemptNumber', header: 'Intento' },
        { key: 'status', header: 'Estado' },
        { key: 'grade', header: 'Nota' },
        { key: 'submittedAt', header: 'Fecha de entrega' },
      ],
    );
  }

  async getRawLessonViewsCsv(courseId?: string): Promise<string> {
    const tenantId = this.tenantContext.requireTenantId();
    const rows = await this.prisma.withTenant(tenantId, (tx) =>
      tx.lessonView.findMany({
        where: courseId ? { lesson: { module: { courseId } } } : undefined,
        include: {
          lesson: { include: { module: { include: { course: true } } } },
          enrollment: { include: { userTenant: { include: { user: true } } } },
        },
        orderBy: { firstViewedAt: 'asc' },
      }),
    );
    return toCsv(
      rows.map((v) => ({
        studentEmail: v.enrollment.userTenant.user.email,
        courseTitle: v.lesson.module.course.title,
        moduleTitle: v.lesson.module.title,
        lessonTitle: v.lesson.title,
        firstViewedAt: v.firstViewedAt.toISOString(),
      })),
      [
        { key: 'studentEmail', header: 'Email' },
        { key: 'courseTitle', header: 'Curso' },
        { key: 'moduleTitle', header: 'Módulo' },
        { key: 'lessonTitle', header: 'Lección' },
        { key: 'firstViewedAt', header: 'Primera vista' },
      ],
    );
  }

  // ==========================================================================
  // "REPORTES PERSONALIZADOS" (plan Pro, ver lib/pricing.ts) — CRUD de
  // presets + generacion proyectando solo las columnas guardadas.
  // ==========================================================================

  async listPresets() {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, (tx) => tx.reportPreset.findMany({ orderBy: { createdAt: 'desc' } }));
  }

  async createPreset(dto: { name: string; reportType: (typeof REPORT_PRESET_TYPES)[number]; columns: string[] }) {
    const tenantId = this.tenantContext.requireTenantId();
    const validKeys = new Set(REPORT_COLUMN_CATALOG[dto.reportType].map((c) => c.key));
    const invalid = dto.columns.filter((c) => !validKeys.has(c));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Columna(s) inválida(s) para "${dto.reportType}": ${invalid.join(', ')}.`,
      );
    }
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.reportPreset.create({
        data: { tenantId, name: dto.name, reportType: dto.reportType, columns: dto.columns },
      }),
    );
  }

  async deletePreset(id: string) {
    const tenantId = this.tenantContext.requireTenantId();
    await this.prisma.withTenant(tenantId, async (tx) => {
      const existing = await tx.reportPreset.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`No existe el reporte personalizado "${id}".`);
      }
      await tx.reportPreset.delete({ where: { id } });
    });
    return { deleted: true };
  }

  private async loadPresetRows(presetId: string, courseId?: string) {
    const tenantId = this.tenantContext.requireTenantId();
    const preset = await this.prisma.withTenant(tenantId, (tx) => tx.reportPreset.findUnique({ where: { id: presetId } }));
    if (!preset) {
      throw new NotFoundException(`No existe el reporte personalizado "${presetId}".`);
    }
    const reportType = preset.reportType as (typeof REPORT_PRESET_TYPES)[number];
    const columns = (preset.columns as string[]).filter((key) =>
      REPORT_COLUMN_CATALOG[reportType].some((c) => c.key === key),
    );
    const catalogByKey = new Map(REPORT_COLUMN_CATALOG[reportType].map((c) => [c.key, c.header]));
    const selectedColumns = columns.map((key) => ({ key, header: catalogByKey.get(key)! }));

    // "as unknown as ..." abajo: AttendanceReportRow/EnrollmentProgressRow
    // no declaran indice de string (mismo motivo que csv.util.ts, "toCsv",
    // no exige "extends Record<string, unknown>") — aca SI hace falta
    // indexar por "key" dinamico (ver el "for" de generateCustomReport),
    // asi que el cast es la unica forma de decir "confio en que las keys
    // de REPORT_COLUMN_CATALOG son un subconjunto real de estos campos".
    let rows: Array<Record<string, unknown>>;
    if (reportType === 'attendance') {
      rows = (await this.getAttendanceReport(courseId)) as unknown as Array<Record<string, unknown>>;
    } else if (reportType === 'enrollment_progress') {
      rows = (await this.getEnrollmentProgressReport(courseId)) as unknown as Array<Record<string, unknown>>;
    } else {
      if (!courseId) {
        throw new BadRequestException('Este reporte personalizado es de "notas": necesita "courseId".');
      }
      const { results } = await this.getGradesReport(courseId);
      rows = results.map((r) => ({
        studentName: r.student.fullName,
        studentEmail: r.student.email,
        sectionName: r.section.name,
        finalScore: r.finalScore,
        letterGrade: r.letterGrade ?? '',
      }));
    }

    return { preset, selectedColumns, rows };
  }

  async generateCustomReport(presetId: string, courseId?: string) {
    const { preset, selectedColumns, rows } = await this.loadPresetRows(presetId, courseId);
    const projected = rows.map((row) => {
      const out: Record<string, unknown> = {};
      for (const c of selectedColumns) out[c.key] = row[c.key];
      return out;
    });
    return { preset, columns: selectedColumns, rows: projected };
  }

  async generateCustomReportCsv(presetId: string, courseId?: string): Promise<string> {
    const { selectedColumns, rows } = await this.loadPresetRows(presetId, courseId);
    return toCsv(
      rows,
      selectedColumns.map((c) => ({ key: c.key, header: c.header })),
    );
  }
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
