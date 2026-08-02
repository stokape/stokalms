// ============================================================================
// upload-resource.dto.ts — Campos de texto que acompañan al archivo en
// "POST .../resources" (multipart/form-data). El archivo en sí NO es parte
// de este DTO: FileInterceptor lo saca del body antes de que llegue a
// class-validator y lo entrega aparte como "@UploadedFile()" (ver
// resource.controller.ts).
// ============================================================================

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadResourceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;
}
