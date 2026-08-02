// ============================================================================
// tenant-registration.module.ts — Alta de instituciones nuevas (ver
// docs/architecture/06-roadmap.md). No necesita importar AuthModule
// explicitamente: PlatformAdminGuard ya se exporta desde alli y AuthModule
// no es @Global(), asi que SI hace falta importarlo aca para poder
// inyectar el guard en el controller (a diferencia de TenantModule/
// RbacModule/StorageModule, que si son @Global()).
// ============================================================================

import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { TenantRegistrationController } from './tenant-registration.controller';
import { TenantRegistrationService } from './tenant-registration.service';

@Module({
  imports: [AuthModule],
  controllers: [TenantRegistrationController],
  providers: [TenantRegistrationService],
})
export class TenantRegistrationModule {}
