// ============================================================================
// rbac.module.ts — Agrupa el motor de permisos (Casbin) y su guard.
//
// Se marca @Global() por el mismo motivo que PrismaModule (ver
// src/prisma/prisma.module.ts): practicamente todos los modulos de negocio
// (Academico, Matricula, Evaluaciones...) necesitan PermissionsGuard y
// @RequirePermission en sus controladores, y repetir el import de
// RbacModule en cada uno seria puro ruido.
// ============================================================================

import { Global, Module } from '@nestjs/common';
import { CasbinService } from './casbin.service';
import { PermissionsGuard } from './permissions.guard';

@Global()
@Module({
  providers: [CasbinService, PermissionsGuard],
  exports: [CasbinService, PermissionsGuard],
})
export class RbacModule {}
