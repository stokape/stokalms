// ============================================================================
// create-tenant-registration.dto.ts — Body de
// "POST /api/v1/tenant-registration-requests". Es el UNICO endpoint de
// negocio de todo el backend, junto con GET /verify/:codigo, que NO exige
// autenticacion: quien completa el formulario de "inscribi tu institucion"
// (ver apps/web/app/registro-institucion/) todavia no tiene ninguna cuenta
// en la plataforma.
// ============================================================================

import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateTenantRegistrationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  institutionName: string;

  // Se valida el formato aca (subdominio valido: minusculas, numeros y
  // guiones, sin empezar/terminar en guion) para poder avisarle a la
  // persona en el momento si escribio algo invalido, en vez de que el
  // error aparezca recien al aprobar la solicitud (ver
  // tenant-registration.service.ts, que ademas valida que el dominio
  // resultante no este ya en uso).
  @IsString()
  @Matches(/^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])?$/, {
    message:
      'El subdominio debe tener entre 3 y 40 caracteres, solo minusculas, numeros y guiones, sin empezar ni terminar en guion.',
  })
  desiredSubdomain: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  contactName: string;

  @IsEmail()
  contactEmail: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
