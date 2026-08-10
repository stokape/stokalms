// ============================================================================
// user.controller.ts — Rutas HTTP del panel de administracion de usuarios y
// roles. Todo bajo el permiso "role" (view/assign, ya sembrado en
// prisma/seed.js) — no un recurso "user" aparte, porque lo que este panel
// controla ES la asignacion de roles, no datos personales del usuario.
// ============================================================================

import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { RequirePermission } from '../../rbac/require-permission.decorator';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.service';
import { UserService } from './user.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { EditUserProfileDto } from './dto/edit-user-profile.dto';
import { BulkAssignRoleDto } from './dto/bulk-assign-role.dto';

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
  assignRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userTenantId') userTenantId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.userService.assignRole(userTenantId, dto, user.userId);
  }

  // "Gestion avanzada de usuarios" — asignar un rol a muchas personas de
  // una vez, via CSV (ver user.service.ts, "bulkAssignRole"). Mismo
  // permiso que asignar UN rol a la vez: es la misma accion, en bloque.
  @RequirePermission('role', 'assign')
  @Post('users/bulk-assign-role')
  bulkAssignRole(@CurrentUser() user: AuthenticatedUser, @Body() dto: BulkAssignRoleDto) {
    return this.userService.bulkAssignRole(dto, user.userId);
  }

  @RequirePermission('role', 'assign')
  @Delete('users/:userTenantId/roles/:userRoleId')
  removeRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userTenantId') userTenantId: string,
    @Param('userRoleId') userRoleId: string,
  ) {
    return this.userService.removeRole(userTenantId, userRoleId, user.userId);
  }

  @RequirePermission('user_profile', 'edit')
  @Get('users/:userTenantId/profile')
  getProfile(@Param('userTenantId') userTenantId: string) {
    return this.userService.getProfile(userTenantId);
  }

  @RequirePermission('user_profile', 'edit')
  @Patch('users/:userTenantId/profile')
  updateProfile(
    @Param('userTenantId') userTenantId: string,
    @Body() dto: EditUserProfileDto,
  ) {
    return this.userService.updateProfile(userTenantId, dto);
  }
}
