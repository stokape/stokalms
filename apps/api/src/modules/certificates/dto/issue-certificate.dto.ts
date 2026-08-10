// ============================================================================
// issue-certificate.dto.ts — Body de
// "POST /api/v1/enrollments/:enrollmentId/certificates".
//
// "templateId" es OPCIONAL: por defecto se usa la plantilla fija asignada
// al curso de esta matrícula (ver Course.certificateTemplateId en
// schema.prisma, y certificate.service.ts, "issue") — este campo solo sirve
// como excepción manual, para el caso puntual de necesitar una plantilla
// distinta a la del curso en una emisión concreta.
// ============================================================================

import { IsOptional, IsUUID } from 'class-validator';

export class IssueCertificateDto {
  @IsOptional()
  @IsUUID()
  templateId?: string;
}
