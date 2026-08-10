// ============================================================================
// academic-progress.service.ts — "Avance" de un alumno en un curso puntual:
// lecciones vistas, evaluaciones rendidas, asistencia y nota parcial. Es una
// vista de SOLO LECTURA que combina datos que YA existían por separado
// (LessonView, Submission, AttendanceRecord, Grade) — no agrega ninguna
// regla de negocio nueva, solo los junta para responder "¿cómo viene este
// alumno?" sin tener que abrir cuatro pantallas distintas.
// ============================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { GradebookService } from '../gradebook/gradebook.service';

@Injectable()
export class AcademicProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly gradebookService: GradebookService,
  ) {}

  async getForEnrollment(enrollmentId: string) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const enrollment = await tx.enrollment.findUnique({
        where: { id: enrollmentId },
        include: { section: { include: { course: true } } },
      });
      if (!enrollment) {
        throw new NotFoundException(`No existe la matrícula "${enrollmentId}".`);
      }
      const courseId = enrollment.section.courseId;

      const [lessonsTotal, lessonsViewed, evaluationsTotal, submissions, attendanceRecords] =
        await Promise.all([
          tx.lesson.count({ where: { module: { courseId } } }),
          tx.lessonView.count({ where: { enrollmentId } }),
          tx.assessment.count({ where: { courseId } }),
          tx.submission.findMany({
            where: { enrollmentId, assessment: { courseId } },
            distinct: ['assessmentId'],
            select: { assessmentId: true },
          }),
          tx.attendanceRecord.findMany({ where: { enrollmentId }, select: { status: true } }),
        ]);

      const attendanceTotal = attendanceRecords.length;
      const attendancePresent = attendanceRecords.filter(
        (r) => r.status === 'present' || r.status === 'late',
      ).length;

      // La nota parcial reusa EL MISMO algoritmo de nota final (ver la nota
      // extensa en gradebook.service.ts, computeCourseGrades) — ya excluye
      // (no computa como cero) cualquier categoria sin calificar todavia,
      // asi que sirve tal cual como "parcial" sin cambios. Si el curso
      // todavia no tiene escala de notas asignada, se informa como "no
      // disponible" en vez de romper toda la pantalla de avance.
      let partialGrade: { finalScore: number; letterGrade: string | null } | null = null;
      try {
        const { results } = await this.gradebookService.computeCourseGrades(tx, courseId, {
          onlyPublished: false,
        });
        const mine = results.find((r) => r.enrollmentId === enrollmentId);
        if (mine) {
          partialGrade = { finalScore: mine.finalScore, letterGrade: mine.letterGrade };
        }
      } catch (err) {
        if (!(err instanceof ConflictException)) throw err;
        partialGrade = null;
      }

      return {
        enrollmentId,
        course: { id: enrollment.section.course.id, title: enrollment.section.course.title },
        lessons: { viewed: lessonsViewed, total: lessonsTotal },
        evaluations: { submitted: submissions.length, total: evaluationsTotal },
        attendance:
          attendanceTotal > 0
            ? { present: attendancePresent, total: attendanceTotal, percentage: Math.round((attendancePresent / attendanceTotal) * 100) }
            : null,
        partialGrade,
      };
    });
  }
}
