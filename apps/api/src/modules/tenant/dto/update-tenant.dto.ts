// ============================================================================
// update-tenant.dto.ts — Body de "PATCH /api/v1/tenant" (el tenant ACTIVO
// del request, resuelto por Host — nunca se pasa un id en la URL, ver
// tenant.controller.ts).
//
// El logo y la imagen de fondo NO se editan por aquí: se suben como archivo
// real (ver "POST /tenant/logo" y "POST /tenant/background-image" en
// tenant.controller.ts, mismo patrón que profile.controller.ts con la
// foto de perfil) — pegar una URL a mano quedaba raro para algo que
// cualquier institución va a querer subir desde su propia computadora.
// ============================================================================

import {
  IsBoolean,
  IsHexColor,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// "branding" es JSON libre en la base de datos (ver el comentario en
// schema.prisma, modelo Tenant), pero el DTO SI valida su forma exacta —
// evita que, por ejemplo, alguien guarde un color que no es un color
// valido y recien se note al renderizar el home publico.
class BrandingDto {
  // Color de FONDO de respaldo: se usa cuando todavía no se subió una
  // imagen de fondo, o si la institución prefiere un fondo sólido en vez
  // de una foto — no es obligatorio, pero tampoco se elimina la opción:
  // no toda institución quiere una imagen de fondo.
  @IsOptional()
  @IsHexColor()
  backgroundColor?: string;

  // Color de MARCA: el que usan los botones/links en TODA la app de esta
  // institución (público y logueado) — ver apps/web/app/layout.tsx, que lo
  // traduce a las variables CSS "--primary"/"--primary-hover"/
  // "--primary-foreground". Sin valor = usa el Azul Stoka por defecto.
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  // "Eliminación o personalización avanzada del branding Stoka" (plan Pro,
  // ver lib/pricing.ts): oculta el sello "Hecho con Stoka LMS" que por
  // defecto aparece en el home público, el pie de la app logueada y la
  // página pública de verificación de certificados. Por defecto false
  // (sello visible) — no hay ningun modelo de Plan/Subscription todavia
  // (ver tenant.service.ts), asi que como el resto de los toggles de esta
  // plataforma (automatizaciones, etc.) esto es un interruptor que
  // cualquier Administrador de entidad puede prender, sin verificacion de
  // plan comercial de por medio.
  @IsOptional()
  @IsBoolean()
  hideStokaBranding?: boolean;
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

  // --- Modo mantenimiento (ver tenant.service.ts) ---

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  // Cadena vacia = "borrar el mensaje guardado" (el formulario de
  // /mantenimiento siempre manda este campo, aunque este vacio) — por eso
  // "" es un valor valido y no hace falta ValidateIf aca.
  @IsOptional()
  @IsString()
  @MaxLength(500)
  maintenanceMessage?: string;

  // Igual que arriba: "" = "borrar la fecha guardada". ValidateIf salta el
  // @IsISO8601 justo en ese caso, para no rechazar el "borrar".
  @IsOptional()
  @ValidateIf((_o, value) => value !== '')
  @IsISO8601()
  maintenanceEndsAt?: string;
}
