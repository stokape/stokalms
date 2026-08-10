// ============================================================================
// tenant-settings.module.ts — Ver/editar los datos del tenant activo
// (nombre, marca).
//
// Se llama "TenantSettingsModule" (no "TenantModule") a proposito: ya
// existe una clase "TenantModule" en common/tenant/tenant.module.ts (la
// que resuelve A QUE tenant pertenece un request, infraestructura de todo
// el backend) — dos clases con el mismo nombre en archivos distintos
// compilarian igual, pero confundirian a cualquiera que las viera en un
// stack trace o en el autocompletado del editor.
// ============================================================================

import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  controllers: [TenantController],
  providers: [TenantService],
  // Exportado para que PlatformTenantsModule pueda inyectar TenantService
  // y reusar sus metodos "ParaTenant(tenantId, ...)" — ver la nota extensa
  // en tenant.service.ts sobre por que NO se duplica esa logica ahi.
  exports: [TenantService],
})
export class TenantSettingsModule {}
