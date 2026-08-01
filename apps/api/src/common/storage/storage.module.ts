// ============================================================================
// storage.module.ts — Expone StorageService a toda la aplicacion.
//
// @Global() desde el inicio (a diferencia de TenantModule, que se hizo
// Global recien despues de tropezar dos veces con el mismo error de
// inyeccion de dependencias — ver el comentario alli): ya sabemos por esa
// experiencia que cualquier modulo de negocio que suba archivos va a
// necesitar importar esto, asi que se evita repetir el mismo error a
// proposito.
// ============================================================================

import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';

@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
