// ============================================================================
// update-resource.dto.ts — Body de "PATCH .../resources/:id". Solo permite
// editar los campos "de metadata" (título, descripción) y, para un recurso
// de tipo "link", su URL — nunca el archivo subido en si (para reemplazar
// un archivo hay que borrar el recurso y subir uno nuevo, ver la nota en
// resource.controller.ts sobre por que la subida no soporta streaming/
// reemplazo todavía).
// ============================================================================

import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Solo tiene efecto si el recurso es de tipo "link" (ver
  // resource.service.ts, "update") — en cualquier otro tipo se ignora.
  @IsOptional()
  @IsUrl({ require_tld: false })
  url?: string;
}
