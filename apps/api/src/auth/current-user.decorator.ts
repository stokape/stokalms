// ============================================================================
// current-user.decorator.ts — Atajo para leer "quien hizo este request".
//
// Un "decorador de parametro" personalizado en NestJS permite escribir
//
//   miMetodo(@CurrentUser() user: AuthenticatedUser) { ... }
//
// en vez de tener que escribir, en CADA controlador,
//
//   miMetodo(@Req() req) { const user = req.user; ... }
//
// El valor que devuelve viene de JwtStrategy.validate() (ver jwt.strategy.ts),
// que Passport coloca automaticamente en "req.user" DESPUES de validar el
// token — por eso este decorador solo tiene sentido en rutas protegidas con
// @UseGuards(JwtAuthGuard) (ver jwt-auth.guard.ts); en una ruta sin ese
// guard, "req.user" nunca se llega a poblar.
// ============================================================================

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from './auth.service';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
