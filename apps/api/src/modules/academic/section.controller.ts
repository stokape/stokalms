// ============================================================================
// section.controller.ts — Rutas HTTP de secciones, siempre ANIDADAS bajo su
// curso ("/courses/:courseId/sections/..."). Esto no es solo un detalle de
// estilo REST: PermissionsGuard (ver ../../rbac/permissions.guard.ts) lee el
// parametro de ruta ":courseId" para decidir si un permiso ACOTADO A ESE
// CURSO (ej. un Docente asignado solo a ese curso, ver
// docs/architecture/03-rbac.md, seccion 3.4) alcanza para la operacion.
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
import { SectionService } from './section.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Controller('courses/:courseId/sections')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @RequirePermission('section', 'create')
  @Post()
  create(@Param('courseId') courseId: string, @Body() dto: CreateSectionDto) {
    return this.sectionService.create(courseId, dto);
  }

  @RequirePermission('section', 'view')
  @Get()
  findAll(@Param('courseId') courseId: string) {
    return this.sectionService.findAllByCourse(courseId);
  }

  @RequirePermission('section', 'view')
  @Get(':id')
  findOne(@Param('courseId') courseId: string, @Param('id') id: string) {
    return this.sectionService.findOne(courseId, id);
  }

  @RequirePermission('section', 'edit')
  @Patch(':id')
  update(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.sectionService.update(courseId, id, dto);
  }

  @RequirePermission('section', 'delete')
  @Delete(':id')
  remove(@Param('courseId') courseId: string, @Param('id') id: string) {
    return this.sectionService.remove(courseId, id);
  }
}
