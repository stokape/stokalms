// ============================================================================
// assessment.controller.ts — Rutas HTTP de evaluaciones, anidadas bajo el
// curso.
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
import { AssessmentService } from './assessment.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';

@Controller('courses/:courseId/assessments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @RequirePermission('assessment', 'create')
  @Post()
  create(@Param('courseId') courseId: string, @Body() dto: CreateAssessmentDto) {
    return this.assessmentService.create(courseId, dto);
  }

  @RequirePermission('assessment', 'view')
  @Get()
  findAll(@Param('courseId') courseId: string) {
    return this.assessmentService.findAllByCourse(courseId);
  }

  @RequirePermission('assessment', 'view')
  @Get(':id')
  findOne(@Param('courseId') courseId: string, @Param('id') id: string) {
    return this.assessmentService.findOne(courseId, id);
  }

  @RequirePermission('assessment', 'edit')
  @Patch(':id')
  update(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAssessmentDto,
  ) {
    return this.assessmentService.update(courseId, id, dto);
  }

  @RequirePermission('assessment', 'delete')
  @Delete(':id')
  remove(@Param('courseId') courseId: string, @Param('id') id: string) {
    return this.assessmentService.remove(courseId, id);
  }
}
