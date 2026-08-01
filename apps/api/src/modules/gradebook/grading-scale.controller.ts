// ============================================================================
// grading-scale.controller.ts — Rutas HTTP de escalas de notas. Sin
// ":courseId" en la ruta: son un recurso de TENANT, no de un curso
// especifico (ver la nota en create-grading-scale.dto.ts).
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
import { GradingScaleService } from './grading-scale.service';
import { CreateGradingScaleDto } from './dto/create-grading-scale.dto';
import { UpdateGradingScaleDto } from './dto/update-grading-scale.dto';

@Controller('grading-scales')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GradingScaleController {
  constructor(private readonly gradingScaleService: GradingScaleService) {}

  @RequirePermission('grading_scale', 'create')
  @Post()
  create(@Body() dto: CreateGradingScaleDto) {
    return this.gradingScaleService.create(dto);
  }

  @RequirePermission('grading_scale', 'view')
  @Get()
  findAll() {
    return this.gradingScaleService.findAll();
  }

  @RequirePermission('grading_scale', 'view')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gradingScaleService.findOne(id);
  }

  @RequirePermission('grading_scale', 'edit')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGradingScaleDto) {
    return this.gradingScaleService.update(id, dto);
  }

  @RequirePermission('grading_scale', 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gradingScaleService.remove(id);
  }
}
