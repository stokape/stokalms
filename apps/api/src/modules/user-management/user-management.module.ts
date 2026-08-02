// ============================================================================
// user-management.module.ts — Panel de administracion: ver los miembros del
// tenant y asignarles/quitarles roles (ver user.service.ts).
// ============================================================================

import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserManagementModule {}
