// ============================================================================
// profile.module.ts — "Mi perfil": ver datos personales y actualizar SOLO
// la foto (ver profile.service.ts para el porque de esa restriccion).
// ============================================================================

import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
