// ============================================================================
// update-automation-settings.dto.ts — Body de "PATCH /automations/settings".
// Ver automations.service.ts.
// ============================================================================

import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateAutomationSettingsDto {
  @IsOptional()
  @IsBoolean()
  autoIssueCertificate?: boolean;

  @IsOptional()
  @IsBoolean()
  dueDateReminders?: boolean;

  // "Automatizaciones avanzadas" (plan Pro, ver lib/pricing.ts) — ver
  // automations.service.ts.
  @IsOptional()
  @IsBoolean()
  inactivityAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  atRiskWeeklyDigest?: boolean;
}
