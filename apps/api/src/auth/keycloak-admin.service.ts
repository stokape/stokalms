// ============================================================================
// keycloak-admin.service.ts — Todo lo que hace falta para que una
// institucion nueva quede LISTA para iniciar sesion al aprobarla (ver
// tenant-registration.service.ts): crear la cuenta de la persona de
// contacto, y registrarle a Keycloak el redirect_uri de SU subdominio.
// Antes, sin esto, aprobar una solicitud creaba el Tenant en la base de
// datos de Stoka LMS pero nadie podia iniciar sesion — alguien con acceso
// al servidor tenia que hacer ambas cosas a mano (limitacion documentada
// en README.md hasta ahora).
//
// COMO SE AUTENTICA ESTE SERVICIO CONTRA LA API DE ADMINISTRACION DE
// KEYCLOAK: NO usa el usuario/contraseña del admin real de Keycloak (esas
// credenciales nunca llegan a este backend, solo las tiene
// scripts/setup-keycloak.js, corrido a mano una vez). En cambio, usa la
// identidad DE SERVICIO del propio cliente "stoka-api"
// (grant_type=client_credentials, con el MISMO KEYCLOAK_CLIENT_SECRET que
// ya usa este backend para todo lo demas — ningun secreto nuevo que
// agregar a ningun .env) — ese service account tiene, y SOLO tiene, los
// roles "manage-users" y "manage-clients" (ver ensureAdminServiceAccount
// en scripts/setup-keycloak.js): puede crear/editar usuarios y clientes de
// este realm, nada mas (no administra el realm entero, no puede crear
// OTROS realms).
//
// "manage-clients" en particular es un salto de privilegio real (puede
// reconfigurar CUALQUIER cliente del realm, no solo agregarle un
// redirect_uri a "stoka-web") — se decidio asumirlo a proposito, avisado,
// en vez de seguir agregando el redirect_uri de cada institucion nueva a
// mano (ver la nota extensa en "registerRedirectUri" mas abajo sobre por
// que hace falta).
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';

export interface ProvisionUserResult {
  // null cuando la cuenta YA existia (ver "alreadyExisted") — no hay
  // contraseña nueva que mostrar en ese caso.
  temporaryPassword: string | null;
  alreadyExisted: boolean;
}

interface KeycloakConfig {
  baseUrl: string;
  realm: string;
  clientId: string;
  clientSecret: string;
  webClientId: string;
}

@Injectable()
export class KeycloakAdminService {
  private readonly logger = new Logger(KeycloakAdminService.name);

  constructor(private readonly config: ConfigService) {}

  private get keycloak(): KeycloakConfig {
    return this.config.get<KeycloakConfig>('keycloak')!;
  }

  private get webOrigin(): string {
    return this.config.get<string>('webOrigin')!;
  }

  private async getAdminToken(): Promise<string> {
    const { baseUrl, realm, clientId, clientSecret } = this.keycloak;
    const response = await fetch(`${baseUrl}/realms/${realm}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    if (!response.ok) {
      throw new Error(
        `No se pudo autenticar el service account de "${clientId}" contra Keycloak (HTTP ${response.status}).`,
      );
    }
    const data = await response.json();
    return data.access_token;
  }

  // Crea la cuenta de la persona de contacto con una contraseña temporal
  // (marcada "temporary: true" — Keycloak la obliga a cambiarla en el
  // primer login, asi que mostrarla una sola vez en pantalla, ver
  // admin-plataforma, es seguro). Si YA existe una cuenta con ese email
  // (Keycloak es un unico realm compartido por toda la plataforma — la
  // persona ya inicio sesion antes en OTRA institucion, o ya es Docente en
  // varias), no crea una duplicada: esa cuenta ya sirve para entrar aca
  // tambien en cuanto se le asigne su membresia (ver
  // tenant-registration.service.ts).
  async provisionUser(params: { email: string; fullName: string }): Promise<ProvisionUserResult> {
    const { baseUrl, realm } = this.keycloak;
    const token = await this.getAdminToken();
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const existingResp = await fetch(
      `${baseUrl}/admin/realms/${realm}/users?email=${encodeURIComponent(params.email)}&exact=true`,
      { headers },
    );
    if (!existingResp.ok) {
      throw new Error(`No se pudo consultar usuarios existentes en Keycloak (HTTP ${existingResp.status}).`);
    }
    const existingUsers = await existingResp.json();
    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return { temporaryPassword: null, alreadyExisted: true };
    }

    const temporaryPassword = generateTemporaryPassword();
    const [firstName, ...rest] = params.fullName.trim().split(/\s+/);
    const create = await fetch(`${baseUrl}/admin/realms/${realm}/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: params.email,
        username: params.email,
        firstName: firstName || params.fullName,
        lastName: rest.join(' ') || '—',
        enabled: true,
        // "true": sin esto Keycloak pediria verificar el email antes de
        // dejar entrar, y este backend no tiene (todavia) un servicio de
        // correo propio que mande ese mail — ver la nota en README.md.
        emailVerified: true,
        credentials: [{ type: 'password', value: temporaryPassword, temporary: true }],
      }),
    });
    if (!create.ok) {
      const body = await create.text().catch(() => '');
      throw new Error(`No se pudo crear la cuenta de Keycloak (HTTP ${create.status}). ${body}`.trim());
    }

    this.logger.log(`Cuenta de Keycloak creada para "${params.email}".`);
    return { temporaryPassword, alreadyExisted: false };
  }

  // "Seguridad avanzada" (plan Enterprise, ver security.service.ts): agrega
  // "CONFIGURE_TOTP" a las acciones requeridas de esta cuenta — la proxima
  // vez que inicie sesion, Keycloak la obliga a configurar un segundo
  // factor ANTES de dejarla pasar (flujo nativo de Keycloak, no algo que
  // este backend tenga que implementar). No hay "keycloakId" guardado en
  // ningun lado (User se vincula a Keycloak por EMAIL, ver auth.service.ts,
  // "findOrProvisionUser") — por eso primero se busca la cuenta por email,
  // mismo patron que "provisionUser" mas arriba.
  //
  // Si la persona TODAVIA no tiene cuenta de Keycloak (nunca inicio sesion,
  // ni fue invitada con "provisionUser"), no hay nada que marcar — no es un
  // error, simplemente le va a tocar configurar TOTP en cuanto la cuenta
  // exista (ver la limitacion documentada en security.service.ts).
  async requireTotpForUser(email: string): Promise<{ applied: boolean; reason?: string }> {
    const { baseUrl, realm } = this.keycloak;
    const token = await this.getAdminToken();
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const findResp = await fetch(
      `${baseUrl}/admin/realms/${realm}/users?email=${encodeURIComponent(email)}&exact=true`,
      { headers },
    );
    if (!findResp.ok) {
      throw new Error(`No se pudo buscar la cuenta de "${email}" en Keycloak (HTTP ${findResp.status}).`);
    }
    const [user] = await findResp.json();
    if (!user) {
      return { applied: false, reason: 'todavía no tiene cuenta de Keycloak (nunca inició sesión)' };
    }

    const requiredActions: string[] = user.requiredActions ?? [];
    if (requiredActions.includes('CONFIGURE_TOTP')) {
      return { applied: true, reason: 'ya lo tenía pendiente' };
    }

    const update = await fetch(`${baseUrl}/admin/realms/${realm}/users/${user.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ requiredActions: [...requiredActions, 'CONFIGURE_TOTP'] }),
    });
    if (!update.ok) {
      throw new Error(`No se pudo actualizar la cuenta de "${email}" en Keycloak (HTTP ${update.status}).`);
    }
    return { applied: true };
  }

  // Registra en el cliente OIDC "stoka-web" el origen COMPLETO del
  // subdominio de una institucion (redirect_uri de login, webOrigin para
  // CORS, y post_logout_redirect_uri) — SIN esto, aprobar una institucion
  // la dejaba con su cuenta creada pero incapaz de iniciar sesion: Keycloak
  // rechaza cualquier redirect_uri que no este en la lista EXACTA del
  // cliente, y a proposito NO acepta comodines en la parte del
  // host/subdominio de esa lista (es una proteccion real de OAuth2, no un
  // descuido — un comodin ahi dejaria que un subdominio ajeno se robara un
  // codigo de autorizacion). Por eso cada institucion nueva necesita su
  // propia entrada explicita, una por una.
  async registerRedirectUri(domain: string): Promise<void> {
    const { baseUrl, realm, webClientId } = this.keycloak;
    const token = await this.getAdminToken();
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const listResp = await fetch(
      `${baseUrl}/admin/realms/${realm}/clients?clientId=${encodeURIComponent(webClientId)}`,
      { headers },
    );
    if (!listResp.ok) {
      throw new Error(`No se pudo buscar el cliente "${webClientId}" en Keycloak (HTTP ${listResp.status}).`);
    }
    const [client] = await listResp.json();
    if (!client) {
      throw new Error(`No existe el cliente "${webClientId}" en el realm "${realm}" de Keycloak.`);
    }

    const origin = originForDomain(domain, this.webOrigin);
    const callbackUri = `${origin}/api/auth/callback/keycloak`;
    const logoutUri = `${origin}/*`;

    const redirectUris: string[] = client.redirectUris ?? [];
    const webOrigins: string[] = client.webOrigins ?? [];
    const existingLogout: string = client.attributes?.['post.logout.redirect.uris'] ?? '';
    const logoutEntries = existingLogout ? existingLogout.split('##') : [];

    // Si ya estaba todo registrado (ej. se corrio dos veces, o alguien ya
    // lo agrego a mano antes de este arreglo) no hace falta un PUT de mas.
    if (redirectUris.includes(callbackUri) && webOrigins.includes(origin) && logoutEntries.includes(logoutUri)) {
      return;
    }

    const update = await fetch(`${baseUrl}/admin/realms/${realm}/clients/${client.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        ...client,
        redirectUris: Array.from(new Set([...redirectUris, callbackUri])),
        webOrigins: Array.from(new Set([...webOrigins, origin])),
        attributes: {
          ...client.attributes,
          'post.logout.redirect.uris': Array.from(new Set([...logoutEntries, logoutUri]))
            .filter(Boolean)
            .join('##'),
        },
      }),
    });
    if (!update.ok) {
      const body = await update.text().catch(() => '');
      throw new Error(
        `No se pudo registrar "${domain}" en el cliente "${webClientId}" de Keycloak (HTTP ${update.status}). ${body}`.trim(),
      );
    }

    this.logger.log(`Redirect_uri de "${domain}" registrado en el cliente "${webClientId}" de Keycloak.`);
  }
}

// Arma el origen COMPLETO (protocolo + puerto, si aplica) de un subdominio
// de institucion a partir de WEB_ORIGIN (ver configuration.ts) — WEB_ORIGIN
// ya trae el protocolo/puerto correctos para este entorno (http+3000 en
// desarrollo, https sin puerto en produccion), lo unico que cambia por
// institucion es el HOST.
function originForDomain(domain: string, webOrigin: string): string {
  const url = new URL(webOrigin);
  url.hostname = domain;
  return url.origin;
}

// 16 bytes al azar, codificados en base64url (sin "+"/"/" que compliquen
// copiar/pegar) — de sobra para una contraseña TEMPORAL de un solo uso,
// forzada a cambiar en el primer login.
function generateTemporaryPassword(): string {
  return randomBytes(16).toString('base64url');
}
