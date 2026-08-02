// ============================================================================
// create-link-resource.dto.ts — Body de "POST .../resources/link". Un
// recurso de tipo "link" no sube ningún archivo: apunta a una URL externa
// (ej. una clase en vivo de Zoom/Meet, un video de YouTube). Se modela como
// endpoint aparte de la subida de archivos (ver upload-resource.dto.ts y
// resource.controller.ts) porque uno recibe multipart/form-data y el otro
// JSON — mezclar los dos en un mismo endpoint complica innecesariamente la
// validación.
// ============================================================================

import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateLinkResourceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  // "require_tld: false" para poder usar enlaces internos en desarrollo
  // (ej. "http://localhost:8080/...") — mismo criterio ya usado en
  // update-tenant.dto.ts para logoUrl/backgroundImageUrl.
  @IsUrl({ require_tld: false })
  url: string;

  @IsOptional()
  @IsString()
  description?: string;
}
