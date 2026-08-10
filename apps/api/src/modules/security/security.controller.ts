// ============================================================================
// security.controller.ts — "GET/PATCH /security/settings" (exigir 2FA) y
// "GET /security/audit-logs" (+ export) — ver security.service.ts.
// ============================================================================

import { Body, Controller, Get, Patch, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.service';
import { sendCsv } from '../../common/csv/csv.util';
import { SecurityService } from './security.service';
import { UpdateSecuritySettingsDto } from './dto/update-security-settings.dto';

@Controller('security')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  // Mismo permiso que /configuracion-marca, /dominios, /mantenimiento:
  // decisiones de la institucion entera, no de un curso puntual.
  @RequirePermission('tenant', 'edit')
  @Get('settings')
  getSettings() {
    return this.securityService.getSettings();
  }

  @RequirePermission('tenant', 'edit')
  @Patch('settings')
  updateSettings(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateSecuritySettingsDto) {
    return this.securityService.updateSettings(user, dto.require2FA);
  }

  @RequirePermission('audit', 'view')
  @Get('audit-logs')
  getAuditLogs(@Query('limit') limit?: string) {
    return this.securityService.getAuditLogs(limit ? Number(limit) : undefined);
  }

  @RequirePermission('audit', 'export')
  @Get('audit-logs/export')
  async exportAuditLogs(@Res() res: Response) {
    const csv = await this.securityService.getAuditLogsCsv();
    sendCsv(res, csv, 'auditoria.csv');
  }
}
