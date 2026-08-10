// ============================================================================
// automations.controller.ts — Prender/apagar las automatizaciones del
// tenant activo. Gateado con "tenant:edit" (no un permiso nuevo): es una
// configuracion a nivel de INSTITUCION, exclusiva de Super Admin/
// Administrador de entidad — mismo criterio que mantenimiento/dominios/marca.
// ============================================================================

import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { AutomationsService } from './automations.service';
import { UpdateAutomationSettingsDto } from './dto/update-automation-settings.dto';

@Controller('automations/settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @RequirePermission('tenant', 'edit')
  @Get()
  getSettings() {
    return this.automationsService.getSettings();
  }

  @RequirePermission('tenant', 'edit')
  @Patch()
  updateSettings(@Body() dto: UpdateAutomationSettingsDto) {
    return this.automationsService.updateSettings(dto);
  }
}
