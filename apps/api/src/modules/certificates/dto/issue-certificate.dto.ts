// ============================================================================
// issue-certificate.dto.ts — Body de
// "POST /api/v1/enrollments/:enrollmentId/certificates".
// ============================================================================

import { IsUUID } from 'class-validator';

export class IssueCertificateDto {
  @IsUUID()
  templateId: string;
}
