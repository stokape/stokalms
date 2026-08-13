// ============================================================================
// notification.controller.ts — "/notifications": SIEMPRE las propias, nunca
// las de otra persona (mismo criterio que MyEnrollmentsController, ver la
// nota extensa alli) — por eso solo lleva JwtAuthGuard, sin
// PermissionsGuard: el propio "userTenantId" de quien pregunta es el unico
// filtro que aplica, no hace falta un permiso administrativo para ver los
// avisos que a uno mismo le llegaron.
// ============================================================================

import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthenticatedUser } from '../../auth/auth.service';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.findMine(user);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.unreadCount(user);
  }

  @Post(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.markRead(user, id);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.markAllRead(user);
  }
}
