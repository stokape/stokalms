// ============================================================================
// dashboard.service.ts — Panel de administracion de UNA institucion:
// numeros agregados sobre datos que YA existen (cursos, matriculas,
// asistencia, evaluaciones, certificados) — no agrega ninguna tabla nueva
// de "metricas" propia, mismo criterio que academic-progress.service.ts
// ("es una vista de SOLO LECTURA que combina datos que ya existian").
//
// Dos niveles, no dos pantallas distintas: "getSummary()" son los widgets
// BASICOS (permiso "dashboard:view", ver seed.js — lo tienen Coordinador
// académico, Docente y Auditor/Invitado ademas de Admin/Super Admin).
// "getEnterpriseSummary()" son los widgets EXTRA que solo ve quien tiene
// "tenant:edit" (exclusivo de Super Admin/Administrador de entidad, mismo
// permiso que ya gatea mantenimiento/dominios/marca) — se resuelve en el
// FRONTEND (dashboard/page.tsx) pidiendo o no este segundo endpoint segun
// los permisos que ya trae la sesion, nunca escondiendo datos en un campo
// que el frontend igual recibe y decide no mostrar.
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async getSummary() {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [
        activeCourses,
        activeEnrollments,
        completedEnrollments,
        attendanceRecords,
        certificatesIssued30d,
        submissionsPendingGrading,
      ] = await Promise.all([
        tx.course.count(),
        tx.enrollment.count({ where: { status: 'active' } }),
        tx.enrollment.count({ where: { status: 'completed' } }),
        // Asistencia de los ultimos 30 dias, para una tasa que refleje el
        // presente (no arrastrar sesiones de hace un año) — mismo criterio
        // de ventana que analytics.service.ts (getFunnel, "windowDays").
        tx.attendanceRecord.findMany({
          where: { sessionDate: { gte: since30d } },
          select: { status: true },
        }),
        tx.certificate.count({ where: { revoked: false, issuedAt: { gte: since30d } } }),
        // Entregas YA enviadas (no borradores "in_progress") pero SIN nota
        // todavia — justo lo que un Docente/Coordinador necesita saber de
        // un vistazo: cuanto trabajo de correccion queda pendiente.
        tx.submission.count({ where: { grade: null, status: { not: 'in_progress' } } }),
      ]);

      const attendanceTotal = attendanceRecords.length;
      const attendancePresent = attendanceRecords.filter(
        (r) => r.status === 'present' || r.status === 'late',
      ).length;

      return {
        activeCourses,
        activeEnrollments,
        completedEnrollments,
        // "null" (no "0") cuando no hay NINGUN registro de asistencia
        // todavia — 0% seria enganoso (parece que todos faltaron, cuando en
        // realidad nadie tomo asistencia todavia).
        attendanceRate30d: attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : null,
        certificatesIssued30d,
        submissionsPendingGrading,
      };
    });
  }

  // Widgets "empresariales": vista mas amplia (entre cursos, no de uno a la
  // vez) — pensada para quien administra la institucion entera, no el dia a
  // dia de un curso puntual.
  async getEnterpriseSummary() {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const since60d = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      const [topCoursesRaw, cohortsRaw, enrollmentsLast30d, enrollmentsPrior30d] = await Promise.all([
        // Top 5 cursos por matriculas activas — "groupBy" hace el conteo en
        // SQL en vez de traer todas las matriculas y contarlas en memoria.
        tx.enrollment.groupBy({
          by: ['sectionId'],
          where: { status: 'active' },
          _count: { _all: true },
          orderBy: { _count: { sectionId: 'desc' } },
          take: 5,
        }),
        tx.cohort.findMany({
          select: { id: true, name: true, _count: { select: { members: true } } },
          orderBy: { name: 'asc' },
        }),
        tx.enrollment.count({ where: { enrolledAt: { gte: since30d } } }),
        tx.enrollment.count({ where: { enrolledAt: { gte: since60d, lt: since30d } } }),
      ]);

      // El "groupBy" de arriba trabaja por sectionId (asi arma el conteo en
      // SQL) — aca se resuelve, para cada seccion top, el curso al que
      // pertenece, solo para esas 5 (nunca para todas las secciones del
      // tenant).
      const sections = await tx.section.findMany({
        where: { id: { in: topCoursesRaw.map((r) => r.sectionId) } },
        select: { id: true, name: true, course: { select: { title: true } } },
      });
      const sectionById = new Map(sections.map((s) => [s.id, s]));

      const topCourses = topCoursesRaw.map((r) => ({
        sectionId: r.sectionId,
        sectionName: sectionById.get(r.sectionId)?.name ?? '—',
        courseTitle: sectionById.get(r.sectionId)?.course.title ?? '—',
        activeEnrollments: r._count._all,
      }));

      const cohortBreakdown = cohortsRaw.map((c) => ({
        cohortId: c.id,
        name: c.name,
        memberCount: c._count.members,
      }));

      return {
        topCourses,
        cohortBreakdown,
        enrollmentTrend: {
          last30Days: enrollmentsLast30d,
          previous30Days: enrollmentsPrior30d,
        },
      };
    });
  }
}
