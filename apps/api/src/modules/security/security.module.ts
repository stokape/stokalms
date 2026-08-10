// ============================================================================
// security.module.ts — Ver security.service.ts.
// ============================================================================

import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';

@Module({
  // AuthModule exporta KeycloakAdminService (ver auth.module.ts) — lo
  // necesita "requireTotpForUser". AuditService no hace falta importarlo:
  // AuditModule es @Global() (ver common/audit/audit.module.ts).
  imports: [AuthModule],
  controllers: [SecurityController],
  providers: [SecurityService],
})
export class SecurityModule {}
