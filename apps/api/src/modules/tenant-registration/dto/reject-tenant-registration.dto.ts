// ============================================================================
// reject-tenant-registration.dto.ts — Body de
// "POST /api/v1/tenant-registration-requests/:id/reject".
// ============================================================================

import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectTenantRegistrationDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
