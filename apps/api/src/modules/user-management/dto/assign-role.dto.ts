// ============================================================================
// assign-role.dto.ts — Body de "POST /users/:userTenantId/roles".
// ============================================================================

import { IsOptional, IsUUID } from 'class-validator';

export class AssignRoleDto {
  @IsUUID()
  roleId: string;

  // Si se manda, el rol solo aplica DENTRO de ese curso (ej. un Docente
  // asignado a un curso especifico) — si se omite, aplica a todo el tenant
  // (ver docs/architecture/03-rbac.md, seccion 3.4, y el modelo UserRole en
  // schema.prisma).
  @IsOptional()
  @IsUUID()
  scopeCourseId?: string;
}
