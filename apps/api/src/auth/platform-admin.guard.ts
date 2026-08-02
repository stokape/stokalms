// ============================================================================
// platform-admin.guard.ts — El "portero" de las rutas de administracion de
// PLATAFORMA (hoy, aprobar/rechazar solicitudes de alta de instituciones).
//
// Dos pasos, no uno:
//   1) Activa la estrategia "platform-jwt" (ver platform-jwt.strategy.ts):
//      el token tiene que ser un JWT autentico de Keycloak, igual de
//      estricto que JwtAuthGuard, pero SIN exigir un tenant resuelto.
//   2) Compara el email de ESE token contra PLATFORM_ADMIN_EMAILS (ver
//      configuration.ts) — si no esta en la lista, corta con 403.
//
// Uso en un controlador:
//   @UseGuards(PlatformAdminGuard)
//   @Get()
//   findAll() { ... }
// ============================================================================

import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { PlatformUser } from './platform-jwt.strategy';

@Injectable()
export class PlatformAdminGuard extends AuthGuard('platform-jwt') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Primero valida el token (firma, expiracion, issuer) — si falla, esto
    // ya corta con 401 antes de llegar a la comprobacion de abajo.
    const authenticated = await super.canActivate(context);
    if (!authenticated) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user: PlatformUser = request.user;

    const allowedEmails = this.configService.get<string[]>('platformAdminEmails') ?? [];
    if (!allowedEmails.includes(user.email)) {
      throw new ForbiddenException(
        'Tu cuenta no tiene permiso de administrador de plataforma.',
      );
    }

    return true;
  }
}
