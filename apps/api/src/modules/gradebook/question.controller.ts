// ============================================================================
// question.controller.ts — Rutas HTTP de preguntas, anidadas bajo la
// evaluacion.
// ============================================================================

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.service';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Controller('courses/:courseId/assessments/:assessmentId/questions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @RequirePermission('assessment', 'edit')
  @Post()
  create(
    @Param('courseId') courseId: string,
    @Param('assessmentId') assessmentId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionService.create(courseId, assessmentId, dto);
  }

  // "assessment:view" alcanza para LISTAR (lo tiene tambien el Estudiante,
  // ver prisma/seed.js): el servicio decide, caso por caso, si la respuesta
  // incluye "correctAnswer" o no (ver question.service.ts).
  @RequirePermission('assessment', 'view')
  @Get()
  findAll(
    @Param('courseId') courseId: string,
    @Param('assessmentId') assessmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.questionService.findAllByAssessment(courseId, assessmentId, user);
  }

  @RequirePermission('assessment', 'edit')
  @Patch(':id')
  update(
    @Param('courseId') courseId: string,
    @Param('assessmentId') assessmentId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionService.update(courseId, assessmentId, id, dto);
  }

  @RequirePermission('assessment', 'edit')
  @Delete(':id')
  remove(
    @Param('courseId') courseId: string,
    @Param('assessmentId') assessmentId: string,
    @Param('id') id: string,
  ) {
    return this.questionService.remove(courseId, assessmentId, id);
  }
}
