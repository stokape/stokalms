// ============================================================================
// question.service.ts — CRUD de preguntas dentro de una evaluacion.
//
// DETALLE DE SEGURIDAD IMPORTANTE: "correctAnswer" (la respuesta correcta)
// NUNCA debe llegar a un estudiante que todavia no entrego su intento —
// se le "esconde" ese campo si quien pregunta no tiene el permiso
// "assessment:edit" (que solo tienen Docente/Administrador/Super Admin,
// nunca Estudiante — ver prisma/seed.js). Esto se decide consultando a
// Casbin DIRECTAMENTE desde el servicio (no solo con el guard de la ruta),
// porque la MISMA ruta ("GET .../questions") debe responder distinto segun
// quien la llame — el guard de permisos (ver permissions.guard.ts) solo
// puede dejar pasar o cortar el request completo, no "editar" la respuesta.
// ============================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CasbinService } from '../../rbac/casbin.service';
import { AuthenticatedUser } from '../../auth/auth.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly casbin: CasbinService,
  ) {}

  private async findAssessmentOrThrow(
    courseId: string,
    assessmentId: string,
    tx: Prisma.TransactionClient,
  ) {
    const assessment = await tx.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment || assessment.courseId !== courseId) {
      throw new NotFoundException(
        `No existe la evaluacion "${assessmentId}" en el curso "${courseId}".`,
      );
    }
    return assessment;
  }

  async create(courseId: string, assessmentId: string, dto: CreateQuestionDto) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, async (tx) => {
      await this.findAssessmentOrThrow(courseId, assessmentId, tx);
      return tx.question.create({
        data: {
          tenantId,
          assessmentId,
          type: dto.type,
          body: dto.body as Prisma.InputJsonValue,
          correctAnswer: dto.correctAnswer as Prisma.InputJsonValue,
          points: dto.points,
        },
      });
    });
  }

  async findAllByAssessment(
    courseId: string,
    assessmentId: string,
    user: AuthenticatedUser,
  ) {
    const tenantId = this.tenantContext.requireTenantId();
    const questions = await this.prisma.withTenant(tenantId, async (tx) => {
      await this.findAssessmentOrThrow(courseId, assessmentId, tx);
      return tx.question.findMany({ where: { assessmentId }, orderBy: { id: 'asc' } });
    });

    const canSeeAnswers = await this.casbin.can(
      user.userId,
      user.tenantId,
      'assessment',
      'edit',
      courseId,
    );

    if (canSeeAnswers) {
      return questions;
    }

    // Quien NO puede editar la evaluacion (ej. un Estudiante a punto de
    // rendirla) recibe las preguntas SIN "correctAnswer".
    return questions.map(({ correctAnswer: _correctAnswer, ...rest }) => rest);
  }

  async update(courseId: string, assessmentId: string, id: string, dto: UpdateQuestionDto) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.withTenant(tenantId, async (tx) => {
      await this.findAssessmentOrThrow(courseId, assessmentId, tx);
      const question = await tx.question.findUnique({ where: { id } });
      if (!question || question.assessmentId !== assessmentId) {
        throw new NotFoundException(`No existe la pregunta "${id}" en esta evaluacion.`);
      }

      return tx.question.update({
        where: { id },
        data: {
          ...(dto.body !== undefined && { body: dto.body as Prisma.InputJsonValue }),
          ...(dto.correctAnswer !== undefined && {
            correctAnswer: dto.correctAnswer as Prisma.InputJsonValue,
          }),
          ...(dto.points !== undefined && { points: dto.points }),
        },
      });
    });
  }

  async remove(courseId: string, assessmentId: string, id: string) {
    const tenantId = this.tenantContext.requireTenantId();
    await this.prisma.withTenant(tenantId, async (tx) => {
      await this.findAssessmentOrThrow(courseId, assessmentId, tx);
      const question = await tx.question.findUnique({ where: { id } });
      if (!question || question.assessmentId !== assessmentId) {
        throw new NotFoundException(`No existe la pregunta "${id}" en esta evaluacion.`);
      }
      await tx.question.delete({ where: { id } });
    });
    return { deleted: true };
  }
}
