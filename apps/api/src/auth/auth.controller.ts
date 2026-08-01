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

import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { AuthenticatedUser } from './auth.service';

@Controller('auth')
export class AuthController {
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
