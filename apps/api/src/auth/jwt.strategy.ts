// ============================================================================
// jwt.strategy.ts — Valida los tokens (JWT) que Keycloak emite al iniciar
// sesion.
//
// COMO FUNCIONA (ver docs/architecture/adr/ADR-003-auth-identity.md y
// docs/architecture/05-api-design.md, seccion 5.3): el frontend le pide un
// token a Keycloak directamente (no a nuestro backend), y luego llama a
// nuestra API mandando ese token en el header:
//     Authorization: Bearer <token>
//
// Nuestro backend NUNCA ve la contraseña del usuario ni gestiona el login
// el mismo — solo necesita comprobar que el token es autentico. Para eso:
//   1) Keycloak firma cada token con una clave PRIVADA que solo el conoce.
//   2) Cualquiera puede pedirle a Keycloak su clave PUBLICA correspondiente
//      (endpoint JWKS: /realms/stoka-dev/protocol/openid-connect/certs).
//   3) Con esa clave publica, verificamos la firma matematicamente: si
//      alguien intentara fabricar un token falso sin la clave privada de
//      Keycloak, la verificacion de firma fallaria.
//
// "jwks-rsa" es la libreria que descarga esa clave publica (y la cachea, en
// vez de pedirla en cada request); "passport-jwt" es quien hace el trabajo
// de extraer el token del header y verificar la firma/expiracion.
//
// Relacion con el resto del proyecto:
// - Lee KEYCLOAK_BASE_URL y KEYCLOAK_REALM de src/config/configuration.ts.
// - auth.service.ts usa el resultado de "validate()" para encontrar o crear
//   (aprovisionamiento JIT) el usuario correspondiente en NUESTRA base de datos.
// - jwt-auth.guard.ts es quien realmente "activa" esta estrategia en una ruta.
// ============================================================================

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { AuthService } from './auth.service';

// Forma (parcial) del contenido de un access token de Keycloak. Solo se
// tipan los campos que realmente usamos; Keycloak incluye muchos mas.
export interface KeycloakJwtPayload {
  sub: string; // Identificador UNICO del usuario dentro de Keycloak.
  email?: string;
  email_verified?: boolean;
  preferred_username?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  // "Authorized Party" — el client_id que de verdad pidio este token (ver
  // la nota extensa mas abajo sobre por que se usa esto y no "aud").
  azp?: string;
}

// Clientes de ESTE realm cuyos tokens la API debe aceptar (ver auditoria de
// seguridad, hallazgo F-11). Por defecto, Keycloak pone SIEMPRE "aud":
// "account" en el access token (su cliente interno de cuenta de usuario),
// sin importar que cliente lo pidio — validar "aud" tal cual, sin agregar
// primero un mapper de audiencia propio en Keycloak, rechazaria TODOS los
// logins reales. "azp" (Authorized Party) si identifica correctamente al
// cliente que pidio el token, y Keycloak lo incluye siempre — es el campo
// correcto para esta comprobacion sin tener que tocar la configuracion del
// realm.
const TRUSTED_CLIENT_IDS = ['stoka-api', 'stoka-web'];

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const keycloakBaseUrl = configService.get<string>('keycloak.baseUrl');
    const keycloakRealm = configService.get<string>('keycloak.realm');
    // El "issuer" (emisor) es el realm exacto de Keycloak que debe figurar
    // dentro del token (campo "iss"); si alguien presentara un token de OTRO
    // realm o de otro servidor Keycloak, esta comprobacion lo rechaza.
    const issuer = `${keycloakBaseUrl}/realms/${keycloakRealm}`;

    super({
      // Busca el token en la cabecera "Authorization: Bearer <token>".
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // No verificamos aqui la expiracion nosotros mismos: se lo delegamos
      // a la libreria (ignoreExpiration: false es el default, se deja
      // explicito para que quede claro que es intencional).
      ignoreExpiration: false,
      issuer,
      algorithms: ['RS256'],
      // En vez de una clave fija, "jwks-rsa" resuelve dinamicamente CUAL
      // clave publica usar (Keycloak puede rotar sus claves con el tiempo,
      // identificadas por un "kid" dentro del propio token).
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true, // Evita pedirle a Keycloak la clave en cada request.
        rateLimit: true, // Protege a Keycloak de ser bombardeado de pedidos.
        jwksRequestsPerMinute: 5,
        jwksUri: `${issuer}/protocol/openid-connect/certs`,
      }),
    });
  }

  // Passport llama a este metodo SOLO despues de que la firma y la
  // expiracion del token ya se verificaron matematicamente — si llegamos
  // aqui, el token es autentico y vigente. Lo que devolvemos se convierte en
  // "req.user" para el resto del request (ver current-user.decorator.ts).
  async validate(payload: KeycloakJwtPayload) {
    // Sin esto, un token real de OTRO cliente que se llegara a registrar
    // algun dia en este MISMO realm (ej. una integracion de un tercero)
    // seria igual de valido contra esta API sin que nadie lo decidiera
    // explicitamente — ver auditoria de seguridad, hallazgo F-11.
    if (!payload.azp || !TRUSTED_CLIENT_IDS.includes(payload.azp)) {
      throw new UnauthorizedException('Este token no fue emitido para un cliente reconocido.');
    }
    return this.authService.findOrProvisionUser(payload);
  }
}
