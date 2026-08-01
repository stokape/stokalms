// ============================================================================
// update-term.dto.ts — Body de "PATCH /api/v1/terms/:id". Todos los campos
// son opcionales (a diferencia de CreateTermDto): un PATCH solo actualiza
// los campos que el cliente efectivamente envia, dejando el resto intacto.
// ============================================================================

import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTermDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
