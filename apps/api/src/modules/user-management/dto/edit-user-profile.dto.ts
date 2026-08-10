// ============================================================================
// edit-user-profile.dto.ts — Body de "PATCH /users/:userTenantId/profile".
// Mismos campos de contacto/residencia que "Mi perfil" muestra mas nunca
// deja editar de si mismo (ver profile.service.ts) — la diferencia es QUIEN
// puede usarlo: alguien con "user_profile:edit" (Coordinador académico,
// Administrador), editando el perfil de OTRA persona, nunca el propio desde
// aquí.
// ============================================================================

import { IsOptional, IsString, MaxLength } from 'class-validator';

export class EditUserProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  province?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;
}
