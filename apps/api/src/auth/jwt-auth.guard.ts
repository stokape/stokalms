// ============================================================================
// jwt-auth.guard.ts — El "portero" que exige un token valido en una ruta.
//
// Un "guard" en NestJS corre ANTES de que el request llegue al controlador,
// y decide si lo deja pasar o lo corta con un error. Este guard concreto
// simplemente activa la estrategia registrada como "jwt" (ver
// jwt.strategy.ts): si el token falta, esta vencido, o su firma no
// corresponde a la clave publica de Keycloak, el request se corta con
// 401 Unauthorized ANTES de ejecutar cualquier logica de negocio.
//
// Como se usa en un controlador:
//
//   @UseGuards(JwtAuthGuard)
//   @Get('me')
//   me(@CurrentUser() user: AuthenticatedUser) { ... }
//
// Relacion con el resto del proyecto:
// - auth.module.ts registra JwtStrategy como la estrategia "jwt" que este
//   guard activa.
// - current-user.decorator.ts lee el resultado que este guard deja en
//   "req.user" (puesto ahi por JwtStrategy.validate()).
// ============================================================================

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
