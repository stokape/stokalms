// ============================================================================
// gradebook-category.controller.ts — Rutas HTTP de categorias, anidadas
// bajo el curso (mismo motivo que section.controller.ts).
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
import { GradebookCategoryService } from './gradebook-category.service';
import { CreateGradebookCategoryDto } from './dto/create-gradebook-category.dto';
import { UpdateGradebookCategoryDto } from './dto/update-gradebook-category.dto';

@Controller('courses/:courseId/gradebook-categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GradebookCategoryController {
  constructor(private readonly categoryService: GradebookCategoryService) {}

  @RequirePermission('gradebook_category', 'create')
  @Post()
  create(@Param('courseId') courseId: string, @Body() dto: CreateGradebookCategoryDto) {
    return this.categoryService.create(courseId, dto);
  }

  @RequirePermission('gradebook_category', 'view')
  @Get()
  findAll(@Param('courseId') courseId: string) {
    return this.categoryService.findAllByCourse(courseId);
  }

  @RequirePermission('gradebook_category', 'view')
  @Get(':id')
  findOne(@Param('courseId') courseId: string, @Param('id') id: string) {
    return this.categoryService.findOne(courseId, id);
  }

  @RequirePermission('gradebook_category', 'edit')
  @Patch(':id')
  update(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGradebookCategoryDto,
  ) {
    return this.categoryService.update(courseId, id, dto);
  }

  @RequirePermission('gradebook_category', 'delete')
  @Delete(':id')
  remove(@Param('courseId') courseId: string, @Param('id') id: string) {
    return this.categoryService.remove(courseId, id);
  }
}
