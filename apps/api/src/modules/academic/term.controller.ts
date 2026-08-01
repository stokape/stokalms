// ============================================================================
// term.controller.ts — Rutas HTTP de periodos academicos.
//
// Todas las rutas exigen dos guards en este orden (ver
// docs/architecture/03-rbac.md, seccion 3.5 para el diagrama del flujo
// completo autenticacion -> permiso -> base de datos):
//   1) JwtAuthGuard: verifica el token de Keycloak, resuelve "req.user".
//   2) PermissionsGuard: usando ese "req.user", pregunta a Casbin si tiene
//      el permiso declarado en @RequirePermission(...).
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
import { TermService } from './term.service';
import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';

@Controller('terms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TermController {
  constructor(private readonly termService: TermService) {}

  @RequirePermission('term', 'create')
  @Post()
  create(@Body() dto: CreateTermDto) {
    return this.termService.create(dto);
  }

  @RequirePermission('term', 'view')
  @Get()
  findAll() {
    return this.termService.findAll();
  }

  @RequirePermission('term', 'view')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.termService.findOne(id);
  }

  @RequirePermission('term', 'edit')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTermDto) {
    return this.termService.update(id, dto);
  }

  @RequirePermission('term', 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.termService.remove(id);
  }
}
