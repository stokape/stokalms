// ============================================================================
// gradebook.service.ts — El calculo de la NOTA FINAL DE CURSO (compuesta,
// ponderada por categoria) y su publicacion — ver
// docs/architecture/04-flujos-criticos.md, seccion 4.2, y
// docs/guia-para-no-tecnicos.md, seccion 4.4 (ejemplo numerico completo).
//
// DECISION DE DISEÑO IMPORTANTE: la nota final de curso NO se guarda en su
// propia tabla — se CALCULA cada vez (aqui) a partir de las notas
// individuales de cada evaluacion (tabla "grades", una fila por Submission,
// ver schema.prisma). Esto evita tener dos fuentes de verdad que se puedan
// desincronizar (ej. si se vuelve a calificar una tarea DESPUES de haber
// "publicado" el curso, la nota final recalculada ya refleja el cambio la
// proxima vez que se consulte, sin tener que acordarse de "recalcular y
// volver a guardar" en ningun otro lado).
// ============================================================================

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CasbinService } from '../../rbac/casbin.service';
import { AuthenticatedUser } from '../../auth/auth.service';
import { applyGradingScale } from './gradebook.util';

export interface StudentResult {
  enrollmentId: string;
  student: { userId: string; email: string; fullName: string };
  finalScore: number;
  letterGrade: string | null;
}

@Injectable()
export class GradebookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly casbin: CasbinService,
  ) {}

  async publish(courseId: string) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const { results, warnings } = await this.computeCourseGrades(tx, courseId, {
        onlyPublished: false,
      });

      // Recien AHORA que ya se calculo todo (y no fallo por falta de
      // escala, ver computeCourseGrades) se marcan como publicadas las
      // notas individuales que todavia no lo estaban — asi un error a
      // mitad de camino nunca deja un "publicado a medias".
      await tx.grade.updateMany({
        where: { submission: { assessment: { courseId } }, published: false },
        data: { published: true },
      });

      const course = await tx.course.findUniqueOrThrow({ where: { id: courseId } });
      const scale = await tx.gradingScale.findUniqueOrThrow({
        where: { id: course.gradingScaleId! },
      });

      return {
        courseId,
        publishedAt: new Date().toISOString(),
        studentsAffected: results.length,
        gradingScale: { type: scale.type, decimalRounding: scale.decimalRounding },
        results,
        warnings,
      };
    });
  }

  async getGrades(courseId: string, user: AuthenticatedUser) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const canViewAll = await this.casbin.can(
        user.userId,
        user.tenantId,
        'grade',
        'view',
        courseId,
      );
      const canViewOwn = await this.casbin.can(
        user.userId,
        user.tenantId,
        'grade',
        'view_own',
        courseId,
      );
      if (!canViewAll && !canViewOwn) {
        // PermissionsGuard ya exigio "grade:view" O "grade:view_own" a
        // nivel de ruta (ver gradebook.controller.ts); este chequeo es
        // una segunda capa que decide QUE PARTE de los resultados se
        // devuelve, no si se devuelve algo — nunca deberia dispararse en
        // la practica, pero se deja como salvaguarda explicita.
        throw new NotFoundException('No tienes acceso a las notas de este curso.');
      }

      const { results, warnings } = await this.computeCourseGrades(tx, courseId, {
        onlyPublished: true,
      });

      const filtered = canViewAll
        ? results
        : results.filter((r) => r.student.userId === user.userId);

      return { courseId, results: filtered, warnings: canViewAll ? warnings : [] };
    });
  }

  // ---------------------------------------------------------------------
  // computeCourseGrades: el algoritmo de ponderacion en si. Recorre cada
  // categoria de gradebook del curso, promedia (con drop_lowest) el
  // porcentaje obtenido en sus evaluaciones, y combina esos promedios
  // segun el peso (weightPct) de cada categoria — EXCLUYENDO del promedio
  // ponderado (no contando como cero) cualquier categoria en la que el
  // estudiante todavia no tenga ninguna nota, tal como se documento en
  // docs/architecture/05-api-design.md, seccion 5.5 (ejemplo de respuesta
  // con "warnings").
  // ---------------------------------------------------------------------
  private async computeCourseGrades(
    tx: Prisma.TransactionClient,
    courseId: string,
    options: { onlyPublished: boolean },
  ): Promise<{ results: StudentResult[]; warnings: string[] }> {
    const course = await tx.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`No existe el curso "${courseId}".`);
    }
    if (!course.gradingScaleId) {
      throw new ConflictException(
        'Este curso no tiene una escala de notas configurada. Asignale una (PATCH /courses/:id) antes de calcular la nota final.',
      );
    }
    const scale = await tx.gradingScale.findUniqueOrThrow({
      where: { id: course.gradingScaleId },
    });

    const categories = await tx.gradebookCategory.findMany({ where: { courseId } });
    const assessments = await tx.assessment.findMany({ where: { courseId } });
    const assessmentById = new Map(assessments.map((a) => [a.id, a]));

    // Todas las entregas YA calificadas (Grade existe) de evaluaciones de
    // este curso, con la matricula y la persona detras de cada una.
    const submissions = await tx.submission.findMany({
      where: {
        assessment: { courseId },
        grade: options.onlyPublished ? { published: true } : { isNot: null },
      },
      include: {
        grade: true,
        enrollment: { include: { userTenant: { include: { user: true } } } },
      },
    });

    // Para cada (matricula, evaluacion), nos quedamos con el MEJOR intento
    // (mayor rawScore) — politica deliberada: reintentar una evaluacion
    // nunca puede EMPEORAR la nota que ya se tenia, solo mejorarla.
    const bestByEnrollmentAssessment = new Map<string, (typeof submissions)[number]>();
    for (const submission of submissions) {
      const key = `${submission.enrollmentId}:${submission.assessmentId}`;
      const current = bestByEnrollmentAssessment.get(key);
      if (!current || (submission.grade?.rawScore ?? 0) > (current.grade?.rawScore ?? 0)) {
        bestByEnrollmentAssessment.set(key, submission);
      }
    }

    // Matriculas distintas presentes en las entregas encontradas (un
    // estudiante sin NINGUNA entrega calificada no aparece en absoluto).
    const enrollmentsById = new Map(submissions.map((s) => [s.enrollmentId, s.enrollment]));

    const results: StudentResult[] = [];
    const warnings: string[] = [];

    for (const [enrollmentId, enrollment] of enrollmentsById) {
      const studentName = enrollment.userTenant.user.fullName;
      const categoryAverages: { weight: number; avg: number }[] = [];

      for (const category of categories) {
        const assessmentsInCategory = assessments.filter(
          (a) => a.gradebookCategoryId === category.id,
        );

        const percentages: number[] = [];
        for (const assessment of assessmentsInCategory) {
          const best = bestByEnrollmentAssessment.get(`${enrollmentId}:${assessment.id}`);
          if (!best?.grade) continue;
          const assessmentDef = assessmentById.get(assessment.id)!;
          percentages.push((best.grade.rawScore / assessmentDef.maxPoints) * 100);
        }

        if (percentages.length === 0) {
          warnings.push(
            `Categoria "${category.name}" sin calificaciones registradas para ${studentName}, se excluyo del promedio ponderado.`,
          );
          continue;
        }

        const sorted = [...percentages].sort((a, b) => a - b);
        const kept = sorted.slice(category.dropLowest);
        const avg = kept.reduce((sum, p) => sum + p, 0) / kept.length;
        categoryAverages.push({ weight: category.weightPct, avg });
      }

      if (categoryAverages.length === 0) {
        warnings.push(`${studentName} no tiene notas registradas en ninguna categoria todavia.`);
        continue;
      }

      const totalWeight = categoryAverages.reduce((sum, c) => sum + c.weight, 0);
      const weightedPct =
        categoryAverages.reduce((sum, c) => sum + c.avg * c.weight, 0) / totalWeight;

      const { finalScore, letterGrade } = applyGradingScale(weightedPct, scale);

      results.push({
        enrollmentId,
        student: {
          userId: enrollment.userTenant.user.id,
          email: enrollment.userTenant.user.email,
          fullName: enrollment.userTenant.user.fullName,
        },
        finalScore,
        letterGrade,
      });
    }

    return { results, warnings };
  }
}
