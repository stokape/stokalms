// ============================================================================
// attendance.service.ts — Lógica de negocio de la asistencia. Mismo patrón
// que enrollment.service.ts: valida que la sección exista y pertenezca al
// curso de la URL antes de tocar nada.
// ============================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private async requireSection(courseId: string, sectionId: string) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, async (tx) => {
      const section = await tx.section.findUnique({ where: { id: sectionId } });
      if (!section || section.courseId !== courseId) {
        throw new NotFoundException(
          `No existe la sección "${sectionId}" en el curso "${courseId}".`,
        );
      }
      return section;
    });
  }

  // "date" viene como "YYYY-MM-DD" (query param) — se normaliza a
  // medianoche UTC para que coincida exactamente con como se guarda en
  // "mark" (mismo criterio en ambos lados, ver el comentario de mas abajo).
  private parseSessionDate(date: string): Date {
    return new Date(`${date}T00:00:00.000Z`);
  }

  // Devuelve el listado ("roster") de la sección con el estado de
  // asistencia de cada alumno para esa fecha — "sin marcar" (null) si
  // todavía no se paso lista ese día. Solo se listan matrículas activas:
  // no tiene sentido tomar asistencia de alguien que ya se retiro.
  async findBySectionAndDate(courseId: string, sectionId: string, date: string) {
    await this.requireSection(courseId, sectionId);
    const tenantId = this.tenantContext.requireTenantId();
    const sessionDate = this.parseSessionDate(date);

    return this.prisma.withTenant(tenantId, async (tx) => {
      const enrollments = await tx.enrollment.findMany({
        where: { sectionId, status: 'active' },
        include: {
          userTenant: { include: { user: true } },
          attendanceRecords: { where: { sessionDate } },
        },
        orderBy: { enrolledAt: 'asc' },
      });

      return enrollments.map((e) => ({
        enrollmentId: e.id,
        student: { fullName: e.userTenant.user.fullName, email: e.userTenant.user.email },
        status: e.attendanceRecords[0]?.status ?? null,
      }));
    });
  }

  // Marca (o corrige, ver el "@@unique" en schema.prisma) la asistencia de
  // toda la sección para una fecha puntual, una fila por alumno.
  async mark(courseId: string, sectionId: string, dto: MarkAttendanceDto) {
    await this.requireSection(courseId, sectionId);
    const tenantId = this.tenantContext.requireTenantId();
    const sessionDate = this.parseSessionDate(dto.sessionDate.slice(0, 10));

    return this.prisma.withTenant(tenantId, async (tx) => {
      // Se valida que CADA enrollmentId pertenezca a esta sección antes de
      // marcar nada — mismo motivo que enrollment.service.ts (updateStatus):
      // el permiso otorgado para esta sección en la URL no debe alcanzar
      // para tocar una matrícula de otra sección con un id adivinado.
      const validEnrollments = await tx.enrollment.findMany({
        where: { sectionId, id: { in: dto.records.map((r) => r.enrollmentId) } },
        select: { id: true },
      });
      const validIds = new Set(validEnrollments.map((e) => e.id));

      const results = [];
      for (const record of dto.records) {
        if (!validIds.has(record.enrollmentId)) {
          throw new NotFoundException(
            `La matrícula "${record.enrollmentId}" no pertenece a esta sección.`,
          );
        }

        const saved = await tx.attendanceRecord.upsert({
          where: {
            enrollmentId_sessionDate: { enrollmentId: record.enrollmentId, sessionDate },
          },
          update: { status: record.status },
          create: {
            tenantId,
            enrollmentId: record.enrollmentId,
            sessionDate,
            status: record.status,
            method: 'manual',
          },
        });
        results.push(saved);
      }

      return { marked: results.length };
    });
  }
}
