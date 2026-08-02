// ============================================================================
// auth.controller.ts — Endpoint de prueba para confirmar que el login
// funciona de punta a punta.
//
// GET /api/v1/auth/me es intencionalmente el endpoint MAS SIMPLE posible
// detras de autenticacion: no consulta nada de negocio, solo devuelve lo que
// el propio proceso de autenticacion (Keycloak -> JwtStrategy -> AuthService)
// ya resolvio sobre quien esta llamando. Sirve como "termometro": si esto
// responde bien, toda la cadena de autenticacion esta funcionando.
// ============================================================================

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { AuthenticatedUser } from './auth.service';
import { CasbinService } from '../rbac/casbin.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly casbin: CasbinService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    // "permissions" (alcance TENANT, sin curso especifico) es lo que usa el
    // frontend para decidir que enlaces de navegacion mostrar (ver
    // apps/web/app/(app)/layout.tsx) — cosas como "Configuracion de marca"
    // o "Usuarios y roles" no dependen de ningun curso en particular.
    const permissions = await this.casbin.getPermissions(user.userId, user.tenantId);
    return { ...user, permissions };
  }

  // Version ACOTADA A UN CURSO especifico: un Docente puede tener un rol
  // asignado SOLO para un curso puntual (ver docs/architecture/03-rbac.md,
  // seccion 3.4) — las pantallas anidadas bajo un curso (modulos,
  // evaluaciones, secciones) necesitan preguntar "que puedo hacer EN ESTE
  // curso", no solo "que puedo hacer en todo el tenant".
  @UseGuards(JwtAuthGuard)
  @Get('permissions')
  async permissions(@CurrentUser() user: AuthenticatedUser, @Query('courseId') courseId?: string) {
    const permissions = await this.casbin.getPermissions(user.userId, user.tenantId, courseId);
    return { permissions };
  }
}
