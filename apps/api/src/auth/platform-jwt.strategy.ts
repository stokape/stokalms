// ============================================================================
// platform-jwt.strategy.ts — Valida el MISMO token de Keycloak que
// jwt.strategy.ts, pero SIN pasar por AuthService.findOrProvisionUser.
//
// POR QUE HACE FALTA UNA SEGUNDA ESTRATEGIA: JwtStrategy.validate() (ver
// jwt.strategy.ts) siempre llama a "findOrProvisionUser", que internamente
// exige un tenant YA RESUELTO por el Host del request (ver
// tenant-context.middleware.ts) — si no hay tenant, lanza
// UnauthorizedException. Eso tiene sentido para CUALQUIER dato de negocio
// (todo pertenece a un tenant), pero NO para aprobar una solicitud de alta
// de una institucion NUEVA: por definicion, ese request no llega desde el
// dominio de ningun tenant (la institucion todavia no existe), asi que la
// estrategia normal SIEMPRE lo rechazaria, sin importar quien sea.
//
// Esta estrategia hace lo mismo que la otra en cuanto a SEGURIDAD
// criptografica (misma verificacion de firma/expiracion/issuer contra las
// claves publicas de Keycloak) pero devuelve el email del token tal cual,
// sin tocar la base de datos de tenants — plataform-admin.guard.ts es
// quien decide, con ESE email, si puede pasar.
// ============================================================================

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { KeycloakJwtPayload } from './jwt.strategy';

export interface PlatformUser {
  email: string;
}

@Injectable()
export class PlatformJwtStrategy extends PassportStrategy(Strategy, 'platform-jwt') {
  constructor(configService: ConfigService) {
    const keycloakBaseUrl = configService.get<string>('keycloak.baseUrl');
    const keycloakRealm = configService.get<string>('keycloak.realm');
    const issuer = `${keycloakBaseUrl}/realms/${keycloakRealm}`;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      issuer,
      algorithms: ['RS256'],
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${issuer}/protocol/openid-connect/certs`,
      }),
    });
  }

  async validate(payload: KeycloakJwtPayload): Promise<PlatformUser> {
    const email = payload.email ?? payload.preferred_username;
    if (!email) {
      // No debería pasar nunca (Keycloak siempre manda alguno de los dos),
      // pero sin email no hay forma de chequear la lista de administradores
      // de plataforma — más vale cortar acá con un mensaje claro.
      throw new UnauthorizedException('El token no incluye un email ni un nombre de usuario utilizable.');
    }
    return { email: email.toLowerCase() };
  }
}
