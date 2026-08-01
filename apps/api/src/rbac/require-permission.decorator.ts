// ============================================================================
// require-permission.decorator.ts — Declara, en la firma de una ruta, que
// permiso hace falta para entrar.
//
// Uso tipico en un controlador:
//
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @RequirePermission('course', 'delete')
//   @Delete(':courseId')
//   remove(@Param('courseId') courseId: string) { ... }
//
// "SetMetadata" adjunta esta informacion al metodo sin ejecutar nada todavia
// — es solo una "etiqueta". PermissionsGuard (ver permissions.guard.ts) es
// quien, en tiempo de request, LEE esta etiqueta con Reflector y decide si
// deja pasar o no.
// ============================================================================

import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'stoka:required_permission';

export interface RequiredPermission {
  resource: string;
  action: string;
}

export const RequirePermission = (resource: string, action: string) =>
  SetMetadata(PERMISSION_KEY, { resource, action } satisfies RequiredPermission);
