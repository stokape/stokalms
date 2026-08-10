// ============================================================================
// cohort-comparison-filter.dto.ts — Query params de
// "GET /reports/analytics/cohort-comparison" ("analítica avanzada", plan
// Pro, ver lib/pricing.ts).
// ============================================================================

import { IsOptional, IsString } from 'class-validator';

export class CohortComparisonFilterDto {
  @IsString()
  cohortAId: string;

  @IsString()
  cohortBId: string;

  @IsOptional()
  @IsString()
  courseId?: string;
}
