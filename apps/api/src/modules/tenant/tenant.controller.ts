// ============================================================================
// tenant.controller.ts — Datos del tenant activo (nombre, marca).
//
// "GET public" va ANTES de las rutas protegidas y sin ningun guard a
// proposito: es lo que llama el home de cada institucion (ver
// apps/web/app/page.tsx) ANTES de que la persona haya iniciado sesion.
// ============================================================================

import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { TenantService } from './tenant.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('public')
  getPublicInfo() {
    return this.tenantService.getPublicInfo();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('tenant', 'view')
  @Get()
  getCurrent() {
    return this.tenantService.getCurrent();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('tenant', 'edit')
  @Patch()
  update(@Body() dto: UpdateTenantDto) {
    return this.tenantService.update(dto);
  }
}
