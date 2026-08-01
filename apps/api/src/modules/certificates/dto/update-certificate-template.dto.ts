// ============================================================================
// update-certificate-template.dto.ts — Body de
// "PATCH /api/v1/certificate-templates/:id".
// ============================================================================

import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateCertificateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  htmlTemplate?: string;

  @IsOptional()
  @IsArray()
  dynamicFields?: string[];
}
