// ============================================================================
// cohort.controller.ts — Ver cohort.service.ts. CRUD de la cohorte en si
// (crear/editar/borrar) exige "cohort:create/edit/delete" — solo Super
// Admin/Administrador de entidad los tienen (ver seed.js). Ver/asignar
// miembros exige "cohort:view"/"cohort:assign", que Coordinador académico
// también tiene — puede armar/ajustar quién está en cada cohorte sin poder
// crear cohortes nuevas.
// ============================================================================

import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.service';
import { CohortService } from './cohort.service';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';
import { AddCohortMemberDto } from './dto/add-cohort-member.dto';

@Controller('cohorts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CohortController {
  constructor(private readonly cohortService: CohortService) {}

  @RequirePermission('cohort', 'view')
  @Get()
  findAll() {
    return this.cohortService.findAll();
  }

  @RequirePermission('cohort', 'view')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cohortService.findOne(id);
  }

  @RequirePermission('cohort', 'create')
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCohortDto) {
    return this.cohortService.create(dto, user.userId);
  }

  @RequirePermission('cohort', 'edit')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCohortDto) {
    return this.cohortService.update(id, dto);
  }

  @RequirePermission('cohort', 'delete')
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.cohortService.remove(id, user.userId);
  }

  @RequirePermission('cohort', 'assign')
  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() dto: AddCohortMemberDto) {
    return this.cohortService.addMember(id, dto);
  }

  @RequirePermission('cohort', 'assign')
  @Delete(':id/members/:userTenantId')
  removeMember(@Param('id') id: string, @Param('userTenantId') userTenantId: string) {
    return this.cohortService.removeMember(id, userTenantId);
  }
}
