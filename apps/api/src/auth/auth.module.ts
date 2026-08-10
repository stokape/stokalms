// ============================================================================
// auth.module.ts — Agrupa todo lo de autenticacion.
//
// Relacion con el resto del proyecto:
// - Se importa en app.module.ts para que sus rutas ("/auth/me") y su guard
//   (JwtAuthGuard) esten disponibles para el resto de la aplicacion.
// - PassportModule.register({ defaultStrategy: 'jwt' }) es lo que conecta
//   NestJS con la libreria Passport por debajo de JwtStrategy.
// ============================================================================

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PlatformJwtStrategy } from './platform-jwt.strategy';
import { PlatformAdminGuard } from './platform-admin.guard';
import { KeycloakAdminService } from './keycloak-admin.service';
import { TenantModule } from '../common/tenant/tenant.module';

@Module({
  // TenantModule aporta TenantContextService, que AuthService necesita para
  // saber a que tenant esta iniciando sesion la persona (ver auth.service.ts).
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), TenantModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PlatformJwtStrategy, PlatformAdminGuard, KeycloakAdminService],
  // Se exporta AuthService porque el motor de permisos (Casbin, proximo
  // paso) tambien necesita, en algunos flujos, resolver datos del usuario
  // autenticado. PlatformAdminGuard se exporta para que el modulo de
  // solicitudes de alta (tenant-registration/) pueda protegerse con el, y
  // KeycloakAdminService para que ESE MISMO modulo pueda crear la cuenta
  // de Keycloak de cada institucion nueva al aprobarla.
  exports: [AuthService, PlatformAdminGuard, KeycloakAdminService],
})
export class AuthModule {}
