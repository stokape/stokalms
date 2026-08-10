// ============================================================================
// tenant-domain.module.ts — Ver tenant-domain.controller.ts. A diferencia de
// TenantRegistrationModule, no necesita importar AuthModule: JwtAuthGuard no
// depende de nada especifico de ese modulo (mismo motivo por el que
// TenantSettingsModule tampoco lo importa) y PermissionsGuard viene de
// RbacModule, que es @Global().
// ============================================================================

import { Module } from '@nestjs/common';
import { TenantDomainController } from './tenant-domain.controller';
import { TenantDomainService } from './tenant-domain.service';

@Module({
  controllers: [TenantDomainController],
  providers: [TenantDomainService],
})
export class TenantDomainModule {}
