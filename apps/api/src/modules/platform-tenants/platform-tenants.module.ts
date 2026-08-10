// ============================================================================
// platform-tenants.module.ts — Ver platform-tenants.controller.ts. Necesita
// importar AuthModule (igual que TenantRegistrationModule) para poder
// inyectar PlatformAdminGuard: AuthModule no es @Global().
// ============================================================================

import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { TenantSettingsModule } from '../tenant/tenant-settings.module';
import { PlatformTenantsController } from './platform-tenants.controller';
import { PlatformTenantsService } from './platform-tenants.service';

@Module({
  // TenantSettingsModule: para reusar TenantService (logo/fondo/favicon/
  // color/mantenimiento) sobre CUALQUIER institucion — ver la nota extensa
  // en tenant.service.ts.
  imports: [AuthModule, TenantSettingsModule],
  controllers: [PlatformTenantsController],
  providers: [PlatformTenantsService],
})
export class PlatformTenantsModule {}
