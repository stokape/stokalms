// ============================================================================
// setup-keycloak.js — Configura Keycloak para desarrollo local, por codigo.
//
// POR QUE UN SCRIPT Y NO CONFIGURARLO A MANO EN LA CONSOLA WEB:
// Keycloak (ver docker-compose.yml y docs/architecture/adr/ADR-003-auth-identity.md)
// arranca "en blanco": solo trae el realm "master" para administrarlo a el
// mismo, ningun realm ni cliente de la aplicacion. Configurarlo a mano en
// http://localhost:8080/admin cada vez que alguien clona el repo (o cada vez
// que se reinicia el contenedor sin el volumen persistido) seria un paso
// manual, no reproducible y facil de hacer distinto en cada maquina. Este
// script hace, por la API de administracion de Keycloak, exactamente lo
// mismo que se haria a mano, pero de forma identica siempre.
//
// QUE CREA (idempotente: se puede correr varias veces sin duplicar nada):
//   1) El realm "stoka-dev" (el "espacio" de identidad de desarrollo; en
//      produccion cada tenant podria tener su propio realm, ver ADR-003).
//   2) El cliente "stoka-api" DENTRO de ese realm: es la aplicacion (nuestro
//      backend) que le pide a Keycloak "valida este usuario por mi".
//   3) Un usuario de prueba (maria@stoka-lms.test / Maria12345!) para poder
//      probar el login de punta a punta sin depender de una cuenta real.
//
// Como se usa: "npm run keycloak:setup" (ver el script en package.json,
// raiz del repo). Requiere que "docker compose up -d" ya tenga Keycloak
// corriendo (ver KEYCLOAK_BASE_URL en .env).
// ============================================================================

const KEYCLOAK_BASE_URL = process.env.KEYCLOAK_BASE_URL ?? 'http://localhost:8080';
const REALM_NAME = process.env.KEYCLOAK_REALM ?? 'stoka-dev';
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID ?? 'stoka-api';

// Credenciales del ADMINISTRADOR de Keycloak (no confundir con un usuario de
// la aplicacion): son las mismas que arrancan el contenedor en
// docker-compose.yml (KEYCLOAK_ADMIN / KEYCLOAK_ADMIN_PASSWORD).
const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = 'admin_dev_password';

// Datos del usuario de prueba que este script crea, para poder validar el
// login real (ver apps/api/src/auth/) sin tener que registrar una cuenta.
const TEST_USER = {
  username: 'maria@stoka-lms.test',
  email: 'maria@stoka-lms.test',
  firstName: 'Maria',
  lastName: 'Estudiante',
  password: 'Maria12345!',
};

async function main() {
  console.log(`[keycloak-setup] Conectando a ${KEYCLOAK_BASE_URL}...`);
  const adminToken = await getAdminToken();

  await ensureRealm(adminToken);
  const clientUuid = await ensureClient(adminToken);
  const clientSecret = await getClientSecret(adminToken, clientUuid);
  await ensureTestUser(adminToken);

  console.log('\n[keycloak-setup] Listo. Resumen:');
  console.log(`  Realm:            ${REALM_NAME}`);
  console.log(`  Client ID:        ${CLIENT_ID}`);
  console.log(`  Client Secret:    ${clientSecret}`);
  console.log(`  Usuario de prueba: ${TEST_USER.username} / ${TEST_USER.password}`);
  console.log(
    '\n  Copia "Client Secret" en KEYCLOAK_CLIENT_SECRET dentro de tu .env y apps/api/.env.',
  );
}

// ----------------------------------------------------------------------------
// Pide un token de administrador usando el cliente "admin-cli" (viene
// preconfigurado de fabrica en el realm "master" de cualquier Keycloak
// nuevo) y el usuario/contraseña de administrador del contenedor.
// ----------------------------------------------------------------------------
async function getAdminToken() {
  const response = await fetch(
    `${KEYCLOAK_BASE_URL}/realms/master/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: ADMIN_USER,
        password: ADMIN_PASSWORD,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `No se pudo autenticar como administrador de Keycloak (HTTP ${response.status}). ` +
        `Verifica que el contenedor este arriba ("docker compose ps") y que las ` +
        `credenciales coincidan con docker-compose.yml.`,
    );
  }

  const data = await response.json();
  return data.access_token;
}

// Pequeño helper: todas las llamadas a la API de administracion de Keycloak
// necesitan el mismo header de autorizacion; se centraliza aqui para no
// repetirlo en cada funcion de abajo.
function adminHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// ----------------------------------------------------------------------------
// Crea el realm "stoka-dev" SOLO si todavia no existe (idempotencia).
// ----------------------------------------------------------------------------
async function ensureRealm(adminToken) {
  const check = await fetch(`${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}`, {
    headers: adminHeaders(adminToken),
  });

  if (check.ok) {
    console.log(`[keycloak-setup] El realm "${REALM_NAME}" ya existia.`);
    return;
  }

  const create = await fetch(`${KEYCLOAK_BASE_URL}/admin/realms`, {
    method: 'POST',
    headers: adminHeaders(adminToken),
    body: JSON.stringify({
      realm: REALM_NAME,
      enabled: true,
      // "sslRequired: none" es SOLO para desarrollo local sobre http://.
      // En produccion cada tenant corre bajo https, esto se revierte.
      sslRequired: 'none',
      registrationAllowed: false,
    }),
  });

  if (!create.ok) {
    throw new Error(`No se pudo crear el realm "${REALM_NAME}" (HTTP ${create.status}).`);
  }
  console.log(`[keycloak-setup] Realm "${REALM_NAME}" creado.`);
}

// ----------------------------------------------------------------------------
// Crea el cliente "stoka-api" dentro del realm, SOLO si no existe. Devuelve
// el "id" interno (UUID) que Keycloak le asigna, necesario para las
// siguientes llamadas (ej. leer su client secret).
// ----------------------------------------------------------------------------
async function ensureClient(adminToken) {
  const list = await fetch(
    `${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/clients?clientId=${CLIENT_ID}`,
    { headers: adminHeaders(adminToken) },
  );
  const existing = await list.json();

  if (existing.length > 0) {
    console.log(`[keycloak-setup] El cliente "${CLIENT_ID}" ya existia.`);
    return existing[0].id;
  }

  const create = await fetch(`${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/clients`, {
    method: 'POST',
    headers: adminHeaders(adminToken),
    body: JSON.stringify({
      clientId: CLIENT_ID,
      protocol: 'openid-connect',
      // "confidential" (no publico): el backend SI puede guardar un secreto
      // de forma segura (a diferencia de una SPA en el navegador), por eso
      // "publicClient: false" — ver ADR-003-auth-identity.md.
      publicClient: false,
      // Permite el flujo "usuario+contraseña directos" (Resource Owner
      // Password Credentials). Solo se habilita para poder PROBAR el login
      // por script/Postman durante desarrollo; el frontend real (fase
      // siguiente) usara "Authorization Code + PKCE", el flujo recomendado
      // para aplicaciones con interfaz de usuario.
      directAccessGrantsEnabled: true,
      standardFlowEnabled: true,
      serviceAccountsEnabled: false,
      redirectUris: ['http://localhost:3000/*'],
      webOrigins: ['http://localhost:3000'],
    }),
  });

  if (!create.ok) {
    throw new Error(`No se pudo crear el cliente "${CLIENT_ID}" (HTTP ${create.status}).`);
  }

  // Keycloak no devuelve el objeto creado en el body; hay que volver a
  // consultarlo para obtener su "id" interno.
  const recheck = await fetch(
    `${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/clients?clientId=${CLIENT_ID}`,
    { headers: adminHeaders(adminToken) },
  );
  const [created] = await recheck.json();
  console.log(`[keycloak-setup] Cliente "${CLIENT_ID}" creado.`);
  return created.id;
}

async function getClientSecret(adminToken, clientUuid) {
  const response = await fetch(
    `${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/clients/${clientUuid}/client-secret`,
    { headers: adminHeaders(adminToken) },
  );
  const data = await response.json();
  return data.value;
}

// ----------------------------------------------------------------------------
// Crea el usuario de prueba "maria@stoka-lms.test", SOLO si no existe, y le
// fija una contraseña PERMANENTE (temporary: false, para que no pida
// cambiarla en el primer login durante las pruebas).
// ----------------------------------------------------------------------------
async function ensureTestUser(adminToken) {
  const list = await fetch(
    `${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/users?username=${encodeURIComponent(TEST_USER.username)}`,
    { headers: adminHeaders(adminToken) },
  );
  const existing = await list.json();

  if (existing.length > 0) {
    console.log(`[keycloak-setup] El usuario de prueba "${TEST_USER.username}" ya existia.`);
    return;
  }

  const create = await fetch(`${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/users`, {
    method: 'POST',
    headers: adminHeaders(adminToken),
    body: JSON.stringify({
      username: TEST_USER.username,
      email: TEST_USER.email,
      firstName: TEST_USER.firstName,
      lastName: TEST_USER.lastName,
      enabled: true,
      emailVerified: true,
      credentials: [
        { type: 'password', value: TEST_USER.password, temporary: false },
      ],
    }),
  });

  if (!create.ok) {
    throw new Error(
      `No se pudo crear el usuario de prueba (HTTP ${create.status}).`,
    );
  }
  console.log(`[keycloak-setup] Usuario de prueba "${TEST_USER.username}" creado.`);
}

main().catch((err) => {
  console.error('[keycloak-setup] Error:', err.message);
  process.exit(1);
});
