// ============================================================================
// lesson.controller.ts — Rutas HTTP de las Lecciones, anidadas bajo
// "/courses/:courseId/modules/:moduleId/lessons".
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
import { LessonService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Controller('courses/:courseId/modules/:moduleId/lessons')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @RequirePermission('lesson', 'create')
  @Post()
  create(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessonService.create(courseId, moduleId, dto);
  }

  @RequirePermission('lesson', 'view')
  @Get()
  findAll(@Param('courseId') courseId: string, @Param('moduleId') moduleId: string) {
    return this.lessonService.findAllByModule(courseId, moduleId);
  }

  @RequirePermission('lesson', 'view')
  @Get(':id')
  findOne(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('id') id: string,
  ) {
    return this.lessonService.findOne(courseId, moduleId, id);
  }

  @RequirePermission('lesson', 'edit')
  @Patch(':id')
  update(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonService.update(courseId, moduleId, id, dto);
  }

  @RequirePermission('lesson', 'delete')
  @Delete(':id')
  remove(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('id') id: string,
  ) {
    return this.lessonService.remove(courseId, moduleId, id);
  }
}
