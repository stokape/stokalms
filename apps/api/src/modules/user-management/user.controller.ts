// ============================================================================
// user.controller.ts — Rutas HTTP del panel de administracion de usuarios y
// roles. Todo bajo el permiso "role" (view/assign, ya sembrado en
// prisma/seed.js) — no un recurso "user" aparte, porque lo que este panel
// controla ES la asignacion de roles, no datos personales del usuario.
// ============================================================================

import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { UserService } from './user.service';
import { AssignRoleDto } from './dto/assign-role.dto';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @RequirePermission('role', 'view')
  @Get('users')
  findAll() {
    return this.userService.findAll();
  }

  @RequirePermission('role', 'view')
  @Get('roles')
  findAssignableRoles() {
    return this.userService.findAssignableRoles();
  }

  @RequirePermission('role', 'assign')
  @Post('users/:userTenantId/roles')
  assignRole(@Param('userTenantId') userTenantId: string, @Body() dto: AssignRoleDto) {
    return this.userService.assignRole(userTenantId, dto);
  }

  @RequirePermission('role', 'assign')
  @Delete('users/:userTenantId/roles/:userRoleId')
  removeRole(
    @Param('userTenantId') userTenantId: string,
    @Param('userRoleId') userRoleId: string,
  ) {
    return this.userService.removeRole(userTenantId, userRoleId);
  }
}
