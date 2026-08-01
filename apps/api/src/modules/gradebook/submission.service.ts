// ============================================================================
// submission.service.ts — Entregas/intentos de un estudiante sobre una
// evaluacion, con auto-calificacion (ver docs/architecture/04-flujos-criticos.md,
// seccion 4.2, y gradebook.util.ts para la logica pura de calculo).
// ============================================================================

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CasbinService } from '../../rbac/casbin.service';
import { AuthenticatedUser } from '../../auth/auth.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { GradeAnswerDto } from './dto/grade-answer.dto';
import { applyGradingScale, scoreAnswer } from './gradebook.util';

@Injectable()
export class SubmissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly casbin: CasbinService,
  ) {}

  async create(
    courseId: string,
    assessmentId: string,
    user: AuthenticatedUser,
    dto: SubmitAssessmentDto,
  ) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const assessment = await tx.assessment.findUnique({ where: { id: assessmentId } });
      if (!assessment || assessment.courseId !== courseId) {
        throw new NotFoundException(
          `No existe la evaluacion "${assessmentId}" en el curso "${courseId}".`,
        );
      }

      // El estudiante debe estar matriculado ACTIVAMENTE en alguna seccion
      // de este curso — no alcanza con que el token sea valido, tiene que
      // realmente ser parte del curso (ver docs/architecture/04-flujos-criticos.md,
      // seccion 4.2).
      const enrollment = await tx.enrollment.findFirst({
        where: { userTenantId: user.userTenantId, status: 'active', section: { courseId } },
      });
      if (!enrollment) {
        throw new ForbiddenException('No estas matriculado activamente en este curso.');
      }

      const questions = await tx.question.findMany({ where: { assessmentId } });
      const questionIds = new Set(questions.map((q) => q.id));
      const answeredIds = new Set(dto.answers.map((a) => a.questionId));
      const coversExactly =
        questionIds.size === answeredIds.size &&
        [...questionIds].every((id) => answeredIds.has(id));
      if (!coversExactly) {
        throw new BadRequestException(
          'Debes responder exactamente las preguntas de esta evaluacion (ni de mas ni de menos).',
        );
      }

      const attemptCount = await tx.submission.count({
        where: { assessmentId, enrollmentId: enrollment.id },
      });
      if (attemptCount >= assessment.maxAttempts) {
        throw new ConflictException(
          `Alcanzaste el numero maximo de intentos (${assessment.maxAttempts}) para esta evaluacion.`,
        );
      }

      const submission = await tx.submission.create({
        data: {
          tenantId,
          assessmentId,
          enrollmentId: enrollment.id,
          attemptNumber: attemptCount + 1,
          status: 'submitted',
        },
      });

      const questionById = new Map(questions.map((q) => [q.id, q]));
      for (const item of dto.answers) {
        const question = questionById.get(item.questionId)!;
        const score = scoreAnswer(question, item.answer);
        await tx.submissionAnswer.create({
          data: {
            tenantId,
            submissionId: submission.id,
            questionId: item.questionId,
            answer: item.answer as Prisma.InputJsonValue,
            score,
          },
        });
      }

      // Si TODAS las preguntas son de tipos auto-calificables (ninguna
      // "open"), ya tenemos todos los puntajes y podemos calificar de
      // inmediato; si hay al menos una "open", queda pendiente de revision
      // manual (ver gradeAnswer, mas abajo).
      if (questions.every((q) => q.type !== 'open')) {
        await this.finalizeGradeIfReady(tx, submission.id);
      } else {
        await tx.submission.update({
          where: { id: submission.id },
          data: { status: 'pending_review' },
        });
      }

      return tx.submission.findUnique({
        where: { id: submission.id },
        include: { answers: true, grade: true },
      });
    });
  }

  async gradeAnswer(
    courseId: string,
    assessmentId: string,
    submissionId: string,
    questionId: string,
    dto: GradeAnswerDto,
  ) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const assessment = await tx.assessment.findUnique({ where: { id: assessmentId } });
      if (!assessment || assessment.courseId !== courseId) {
        throw new NotFoundException(
          `No existe la evaluacion "${assessmentId}" en el curso "${courseId}".`,
        );
      }
      const submission = await tx.submission.findUnique({ where: { id: submissionId } });
      if (!submission || submission.assessmentId !== assessmentId) {
        throw new NotFoundException(`No existe la entrega "${submissionId}" en esta evaluacion.`);
      }
      const answer = await tx.submissionAnswer.findUnique({
        where: { submissionId_questionId: { submissionId, questionId } },
      });
      if (!answer) {
        throw new NotFoundException(`No existe la respuesta a la pregunta "${questionId}".`);
      }

      await tx.submissionAnswer.update({
        where: { id: answer.id },
        data: { score: dto.score, feedback: dto.feedback },
      });

      await this.finalizeGradeIfReady(tx, submissionId);

      return tx.submission.findUnique({
        where: { id: submissionId },
        include: { answers: true, grade: true },
      });
    });
  }

  async findAllByAssessment(courseId: string, assessmentId: string, user: AuthenticatedUser) {
    const tenantId = this.tenantContext.requireTenantId();

    return this.prisma.withTenant(tenantId, async (tx) => {
      const assessment = await tx.assessment.findUnique({ where: { id: assessmentId } });
      if (!assessment || assessment.courseId !== courseId) {
        throw new NotFoundException(
          `No existe la evaluacion "${assessmentId}" en el curso "${courseId}".`,
        );
      }

      // "submission:grade" (solo Docente/Admin, ver prisma/seed.js) es la
      // señal de "puede ver las entregas de TODOS"; sin ese permiso, solo
      // ve las propias — el permiso "submission:view" por si solo NO
      // alcanza para distinguir esto porque tanto Docente como Estudiante
      // lo tienen (ver PermissionsGuard en la ruta, que ya exigio al menos
      // "submission:view" antes de llegar aqui).
      const canViewAll = await this.casbin.can(
        user.userId,
        user.tenantId,
        'submission',
        'grade',
        courseId,
      );

      const submissions = await tx.submission.findMany({
        where: {
          assessmentId,
          ...(canViewAll ? {} : { enrollment: { userTenantId: user.userTenantId } }),
        },
        include: {
          answers: true,
          grade: true,
          enrollment: { include: { userTenant: { include: { user: true } } } },
        },
        orderBy: { submittedAt: 'desc' },
      });

      return submissions.map((s) => ({
        id: s.id,
        attemptNumber: s.attemptNumber,
        status: s.status,
        submittedAt: s.submittedAt,
        student: {
          userId: s.enrollment.userTenant.user.id,
          email: s.enrollment.userTenant.user.email,
          fullName: s.enrollment.userTenant.user.fullName,
        },
        answers: s.answers.map((a) => ({
          questionId: a.questionId,
          answer: a.answer,
          score: a.score,
          feedback: a.feedback,
        })),
        grade: s.grade,
      }));
    });
  }

  // ---------------------------------------------------------------------
  // finalizeGradeIfReady: si TODAS las respuestas de la entrega ya tienen
  // puntaje (auto-calificado o puesto a mano por un docente), calcula la
  // nota y crea/actualiza el Grade. Si todavia falta calificar alguna
  // respuesta abierta, no hace nada (se volvera a llamar la proxima vez
  // que se califique una respuesta mas, ver gradeAnswer).
  // ---------------------------------------------------------------------
  private async finalizeGradeIfReady(tx: Prisma.TransactionClient, submissionId: string) {
    const answers = await tx.submissionAnswer.findMany({ where: { submissionId } });
    if (answers.some((a) => a.score === null)) {
      return;
    }

    const submission = await tx.submission.findUniqueOrThrow({
      where: { id: submissionId },
      include: { assessment: { include: { course: true } } },
    });

    const rawScore = answers.reduce((sum, a) => sum + (a.score ?? 0), 0);
    const { maxPoints, config } = submission.assessment;
    const percentage = maxPoints > 0 ? (rawScore / maxPoints) * 100 : 0;

    const { course } = submission.assessment;
    if (!course.gradingScaleId) {
      // Se detiene ANTES de crear una nota mal calculada: sin escala no
      // hay forma correcta de expresar "finalScore" (ver
      // docs/guia-para-no-tecnicos.md, seccion 4.2). El docente debe
      // asignarle una escala al curso (PATCH /courses/:id) antes de que
      // sus evaluaciones puedan calificarse.
      throw new ConflictException(
        'Este curso no tiene una escala de notas configurada. Asignale una (PATCH /courses/:id) antes de calificar evaluaciones.',
      );
    }
    const scale = await tx.gradingScale.findUniqueOrThrow({
      where: { id: course.gradingScaleId },
    });

    const { finalScore, letterGrade } = applyGradingScale(percentage, scale);
    const autoPublish = Boolean((config as Record<string, unknown> | null)?.autoPublish);

    await tx.grade.upsert({
      where: { submissionId },
      update: { rawScore, finalScore, letterGrade, published: autoPublish },
      create: {
        tenantId: submission.tenantId,
        submissionId,
        rawScore,
        finalScore,
        letterGrade,
        published: autoPublish,
      },
    });

    await tx.submission.update({ where: { id: submissionId }, data: { status: 'graded' } });
  }
}
