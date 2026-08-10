// ============================================================================
// add-cohort-member.dto.ts — Body de "POST /cohorts/:id/members". Ver
// cohort.service.ts.
// ============================================================================

import { IsUUID } from 'class-validator';

export class AddCohortMemberDto {
  @IsUUID()
  userTenantId: string;
}
