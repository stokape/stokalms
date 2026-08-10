// ============================================================================
// dashboard.controller.ts — Ver dashboard.service.ts. Dos rutas, un solo
// permiso base ("dashboard:view") mas uno extra ("tenant:edit") para la
// version ampliada — igual que como mantenimiento/dominios reusan
// "tenant:edit" para gatear lo que es exclusivo de Super Admin/
// Administrador de entidad.
// ============================================================================

import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @RequirePermission('dashboard', 'view')
  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @RequirePermission('tenant', 'edit')
  @Get('enterprise-summary')
  getEnterpriseSummary() {
    return this.dashboardService.getEnterpriseSummary();
  }
}
