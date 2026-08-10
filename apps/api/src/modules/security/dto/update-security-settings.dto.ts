// ============================================================================
// update-security-settings.dto.ts — Body de "PATCH /security/settings".
// ============================================================================

import { IsBoolean } from 'class-validator';

export class UpdateSecuritySettingsDto {
  @IsBoolean()
  require2FA: boolean;
}
