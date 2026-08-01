// ============================================================================
// permissions.guard.ts — El "portero de permisos" (distinto del portero de
// autenticacion, jwt-auth.guard.ts).
//
// DIFERENCIA CLAVE con JwtAuthGuard: JwtAuthGuard solo comprueba "¿quien
// eres?" (autenticacion); este guard comprueba "¿puedes hacer ESTO
// especificamente?" (autorizacion). Por eso SIEMPRE se usan juntos y en
// ESE orden:
//
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @RequirePermission('course', 'delete')
//
// Si faltara JwtAuthGuard antes, "request.user" no existiria todavia cuando
// este guard intenta leerlo.
//
// De donde sale el "courseId" para permisos acotados a un curso especifico
// (ver docs/architecture/03-rbac.md, seccion 3.4): se toma, por convencion,
// del parametro de ruta ":courseId" si la ruta lo declara (ej.
// "/courses/:courseId/modules"). Si la ruta no tiene ese parametro, el
// permiso se evalua solo a nivel de todo el tenant.
// ============================================================================

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CasbinService } from './casbin.service';
import { PERMISSION_KEY, RequiredPermission } from './require-permission.decorator';
import { AuthenticatedUser } from '../auth/auth.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly casbin: CasbinService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<RequiredPermission>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    // Si la ruta no declaro @RequirePermission(...), este guard no tiene
    // nada que comprobar: se deja pasar (el control de acceso de esa ruta
    // corre por cuenta de JwtAuthGuard unicamente, o de ningun guard).
    if (!required) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    if (!user) {
      // Esto solo pasaria si alguien usa @RequirePermission sin poner
      // JwtAuthGuard antes — un error de uso del guard, no del usuario final.
      throw new ForbiddenException('No hay un usuario autenticado en el request.');
    }

    const courseId: string | undefined = request.params?.courseId;

    const allowed = await this.casbin.can(
      user.userId,
      user.tenantId,
      required.resource,
      required.action,
      courseId,
    );

    if (!allowed) {
      throw new ForbiddenException(
        `No tienes el permiso "${required.resource}:${required.action}" en este contexto.`,
      );
    }

    return true;
  }
}
