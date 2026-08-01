// ============================================================================
// create-term.dto.ts — Forma exacta que debe tener el body de
// "POST /api/v1/terms" para crear un periodo academico (ver
// docs/architecture/02-modelo-de-datos.md, modelo Term).
//
// "DTO" = Data Transfer Object: una clase que describe la forma de los
// datos que ENTRAN a un endpoint. NestJS, gracias al ValidationPipe global
// (ver src/main.ts), usa esta clase para:
//   1) Rechazar el request con 400 si falta un campo obligatorio o el tipo
//      no corresponde (ej. mandar un numero donde se espera texto).
//   2) Eliminar cualquier campo "de mas" que alguien intente colar en el
//      body (whitelist: true en main.ts) — por ejemplo, evita que alguien
//      intente mandar "tenantId" en el body para hacerse pasar por otro
//      tenant: el tenant SIEMPRE se resuelve del contexto del request
//      (ver TenantContextService), nunca de lo que el cliente envia.
// ============================================================================

import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTermDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string; // Ej. "2026 - Semestre I" (cada tenant elige su propia nomenclatura).

  // "IsDateString" acepta formato ISO 8601 (ej. "2026-03-01"), el mismo que
  // usa el frontend y que Prisma espera para columnas DateTime.
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
