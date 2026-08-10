// ============================================================================
// bulk-assign-role.dto.ts — Body de "POST /users/bulk-assign-role" (ver
// user.service.ts, "bulkAssignRole"). Mismo criterio que bulk-enroll.dto.ts
// (enrollment/dto/): el FRONTEND parsea el CSV que sube la institucion
// (email + nombre del rol) y ya llega aca como filas estructuradas, con
// "roleId" ya resuelto contra "GET /roles" — el backend nunca ve el
// archivo en si.
// ============================================================================

import { ArrayMinSize, IsArray, IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class BulkAssignRoleRowDto {
  // Sin "@IsEmail()" a proposito, mismo motivo que bulk-enroll.dto.ts: un
  // email mal escrito en UNA fila no debe tumbar el request entero — se
  // valida a mano, fila por fila, dentro de user.service.ts.
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsUUID()
  roleId: string;
}

export class BulkAssignRoleDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkAssignRoleRowDto)
  rows: BulkAssignRoleRowDto[];
}
