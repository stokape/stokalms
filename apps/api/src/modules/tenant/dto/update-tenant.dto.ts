// ============================================================================
// update-tenant.dto.ts — Body de "PATCH /api/v1/tenant" (el tenant ACTIVO
// del request, resuelto por Host — nunca se pasa un id en la URL, ver
// tenant.controller.ts).
// ============================================================================

import { IsHexColor, IsObject, IsOptional, IsString, IsUrl, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// "branding" es JSON libre en la base de datos (ver el comentario en
// schema.prisma, modelo Tenant), pero el DTO SI valida su forma exacta —
// evita que, por ejemplo, alguien guarde un color que no es un color
// valido y recien se note al renderizar el home publico.
class BrandingDto {
  @IsOptional()
  @IsUrl({ require_tld: false }) // "require_tld: false" permite "localhost" en desarrollo.
  logoUrl?: string;

  @IsOptional()
  @IsHexColor()
  backgroundColor?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  backgroundImageUrl?: string;
}

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BrandingDto)
  branding?: BrandingDto;
}
