// ============================================================================
// module.controller.ts — Rutas HTTP de los Módulos de un curso, anidadas
// bajo "/courses/:courseId/modules" (mismo motivo que section.controller.ts:
// PermissionsGuard lee ":courseId" para permisos acotados a un curso).
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
import { ModuleService } from './module.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Controller('courses/:courseId/modules')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ModuleController {
  constructor(private readonly moduleService: ModuleService) {}

  @RequirePermission('module', 'create')
  @Post()
  create(@Param('courseId') courseId: string, @Body() dto: CreateModuleDto) {
    return this.moduleService.create(courseId, dto);
  }

  @RequirePermission('module', 'view')
  @Get()
  findAll(@Param('courseId') courseId: string) {
    return this.moduleService.findAllByCourse(courseId);
  }

  @RequirePermission('module', 'view')
  @Get(':id')
  findOne(@Param('courseId') courseId: string, @Param('id') id: string) {
    return this.moduleService.findOne(courseId, id);
  }

  @RequirePermission('module', 'edit')
  @Patch(':id')
  update(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.moduleService.update(courseId, id, dto);
  }

  @RequirePermission('module', 'delete')
  @Delete(':id')
  remove(@Param('courseId') courseId: string, @Param('id') id: string) {
    return this.moduleService.remove(courseId, id);
  }
}
