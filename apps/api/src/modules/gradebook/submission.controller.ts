// ============================================================================
// submission.controller.ts — Rutas HTTP de entregas, anidadas bajo la
// evaluacion.
// ============================================================================

import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.service';
import { SubmissionService } from './submission.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { GradeAnswerDto } from './dto/grade-answer.dto';

@Controller('courses/:courseId/assessments/:assessmentId/submissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @RequirePermission('submission', 'create')
  @Post()
  create(
    @Param('courseId') courseId: string,
    @Param('assessmentId') assessmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitAssessmentDto,
  ) {
    return this.submissionService.create(courseId, assessmentId, user, dto);
  }

  @RequirePermission('submission', 'view')
  @Get()
  findAll(
    @Param('courseId') courseId: string,
    @Param('assessmentId') assessmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.submissionService.findAllByAssessment(courseId, assessmentId, user);
  }

  @RequirePermission('submission', 'grade')
  @Patch(':submissionId/answers/:questionId')
  gradeAnswer(
    @Param('courseId') courseId: string,
    @Param('assessmentId') assessmentId: string,
    @Param('submissionId') submissionId: string,
    @Param('questionId') questionId: string,
    @Body() dto: GradeAnswerDto,
  ) {
    return this.submissionService.gradeAnswer(
      courseId,
      assessmentId,
      submissionId,
      questionId,
      dto,
    );
  }
}
