// ============================================================================
// set-tenant-status.dto.ts — Body de "PATCH /platform/tenants/:tenantId/status".
// ============================================================================

import { IsBoolean } from 'class-validator';

export class SetTenantStatusDto {
  @IsBoolean()
  active: boolean;
}
