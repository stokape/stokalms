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
//   2) El cliente "stoka-api" DENTRO de ese realm: representa al BACKEND
//      (nuestra API), que le pide a Keycloak "valida este usuario por mi".
//   3) El cliente "stoka-web": representa al FRONTEND (apps/web, Next.js
//      con NextAuth.js). Es un cliente APARTE del backend porque cada
//      aplicacion que habla con Keycloak deberia tener su propia identidad
//      y su propio secreto — si el frontend se viera comprometido, revocar
//      SU cliente no afecta al backend, y viceversa.
//   4) Dos usuarios de prueba (ver TEST_USERS mas abajo: una "docente" y un
//      "estudiante") para poder probar el login, y flujos que necesitan DOS
//      personas distintas (ej. Evaluaciones: quien crea el examen no puede
//      ser quien lo rinde), sin depender de cuentas reales.
//
// Como se usa: "npm run keycloak:setup" (ver el script en package.json,
// raiz del repo). Requiere que "docker compose up -d" ya tenga Keycloak
// corriendo (ver KEYCLOAK_BASE_URL en .env).
// ============================================================================

const KEYCLOAK_BASE_URL = process.env.KEYCLOAK_BASE_URL ?? 'http://localhost:8080';
const REALM_NAME = process.env.KEYCLOAK_REALM ?? 'stoka-dev';
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID ?? 'stoka-api';
const WEB_CLIENT_ID = 'stoka-web';

// Credenciales del ADMINISTRADOR de Keycloak (no confundir con un usuario de
// la aplicacion): son las mismas que arrancan el contenedor en
// docker-compose.yml (KEYCLOAK_ADMIN / KEYCLOAK_ADMIN_PASSWORD).
const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = 'admin_dev_password';

// Usuarios de prueba que este script crea, para poder validar el login real
// (ver apps/api/src/auth/) sin tener que registrar una cuenta. Hay UNO por
// cada rol base del sistema (ver SYSTEM_ROLES en prisma/seed.js) para poder
// probar cada rol de forma AISLADA (ver que ve/no ve exactamente ESE rol,
// sin la confusion de una cuenta con varios roles a la vez encima). La
// asignacion del rol correspondiente a cada cuenta NO la hace este script
// (Keycloak no sabe nada de roles de Stoka LMS) — se hace una sola vez
// desde el panel "Usuarios y roles" (o via API) despues del primer login de
// cada cuenta, que es lo que crea su fila en la base de datos de Stoka LMS.
const TEST_USERS = [
  {
    username: 'maria@stoka-lms.test',
    email: 'maria@stoka-lms.test',
    firstName: 'Maria',
    lastName: 'Administradora',
    password: 'Maria12345!',
  },
  {
    username: 'carlos.estudiante@stoka-lms.test',
    email: 'carlos.estudiante@stoka-lms.test',
    firstName: 'Carlos',
    lastName: 'Estudiante',
    password: 'Carlos12345!',
  },
  {
    username: 'superadmin@stoka-lms.test',
    email: 'superadmin@stoka-lms.test',
    firstName: 'Sofia',
    lastName: 'SuperAdmin',
    password: 'SuperAdmin12345!',
  },
  {
    username: 'coordinador@stoka-lms.test',
    email: 'coordinador@stoka-lms.test',
    firstName: 'Carlos',
    lastName: 'Coordinador',
    password: 'Coordinador12345!',
  },
  {
    username: 'docente@stoka-lms.test',
    email: 'docente@stoka-lms.test',
    firstName: 'Diego',
    lastName: 'Docente',
    password: 'Docente12345!',
  },
  {
    username: 'padre@stoka-lms.test',
    email: 'padre@stoka-lms.test',
    firstName: 'Pedro',
    lastName: 'Apoderado',
    password: 'Padre12345!',
  },
  {
    username: 'auditor@stoka-lms.test',
    email: 'auditor@stoka-lms.test',
    firstName: 'Andrea',
    lastName: 'Auditora',
    password: 'Auditor12345!',
  },
];

async function main() {
  console.log(`[keycloak-setup] Conectando a ${KEYCLOAK_BASE_URL}...`);
  const adminToken = await getAdminToken();

  await ensureRealm(adminToken);

  const apiClientUuid = await ensureClient(adminToken, CLIENT_ID, {
    // El backend SI necesita "password grant" (ver mas abajo) para poder
    // probar el login por script/curl sin un navegador de por medio.
    directAccessGrantsEnabled: true,
    redirectUris: ['http://localhost:3000/*'],
    webOrigins: ['http://localhost:3000'],
  });
  const apiClientSecret = await getClientSecret(adminToken, apiClientUuid);

  const webClientUuid = await ensureClient(adminToken, WEB_CLIENT_ID, {
    // El frontend usa el flujo estandar (Authorization Code) a traves de
    // NextAuth.js, que corre en el SERVIDOR de Next.js — por eso este
    // cliente SI puede ser confidencial (con secreto), a diferencia de una
    // SPA pura que corre solo en el navegador. Ver apps/web/src/auth.ts.
    directAccessGrantsEnabled: false,
    // Esta es la URL exacta a la que Keycloak redirige de vuelta despues
    // del login; "callback/keycloak" es la convencion que usa NextAuth.js
    // para el proveedor configurado como "keycloak".
    redirectUris: ['http://localhost:3000/api/auth/callback/keycloak'],
    webOrigins: ['http://localhost:3000'],
  });
  const webClientSecret = await getClientSecret(adminToken, webClientUuid);

  for (const testUser of TEST_USERS) {
    await ensureTestUser(adminToken, testUser);
  }

  console.log('\n[keycloak-setup] Listo. Resumen:');
  console.log(`  Realm:               ${REALM_NAME}`);
  console.log(`  Cliente backend:     ${CLIENT_ID}`);
  console.log(`  Secreto backend:     ${apiClientSecret}`);
  console.log(`  Cliente frontend:    ${WEB_CLIENT_ID}`);
  console.log(`  Secreto frontend:    ${webClientSecret}`);
  for (const testUser of TEST_USERS) {
    console.log(`  Usuario de prueba:   ${testUser.username} / ${testUser.password}`);
  }
  console.log(
    '\n  Copia "Secreto backend" en KEYCLOAK_CLIENT_SECRET dentro de .env y apps/api/.env.',
  );
  console.log(
    '  Copia "Secreto frontend" en AUTH_KEYCLOAK_SECRET dentro de apps/web/.env.local.',
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
// Crea un cliente dentro del realm, SOLO si no existe. Devuelve el "id"
// interno (UUID) que Keycloak le asigna, necesario para las siguientes
// llamadas (ej. leer su client secret). "options" permite que el backend y
// el frontend (que se crean con configuraciones distintas, ver mas arriba)
// reutilicen esta misma funcion.
// ----------------------------------------------------------------------------
async function ensureClient(adminToken, clientId, options) {
  const list = await fetch(
    `${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/clients?clientId=${clientId}`,
    { headers: adminHeaders(adminToken) },
  );
  const existing = await list.json();

  if (existing.length > 0) {
    console.log(`[keycloak-setup] El cliente "${clientId}" ya existia.`);
    return existing[0].id;
  }

  const create = await fetch(`${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/clients`, {
    method: 'POST',
    headers: adminHeaders(adminToken),
    body: JSON.stringify({
      clientId,
      protocol: 'openid-connect',
      // "confidential" (no publico) para AMBOS clientes: tanto el backend
      // como el frontend (Next.js/NextAuth) corren del lado del servidor y
      // pueden guardar un secreto de forma segura — ver ADR-003-auth-identity.md.
      publicClient: false,
      standardFlowEnabled: true,
      serviceAccountsEnabled: false,
      ...options,
    }),
  });

  if (!create.ok) {
    throw new Error(`No se pudo crear el cliente "${clientId}" (HTTP ${create.status}).`);
  }

  // Keycloak no devuelve el objeto creado en el body; hay que volver a
  // consultarlo para obtener su "id" interno.
  const recheck = await fetch(
    `${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/clients?clientId=${clientId}`,
    { headers: adminHeaders(adminToken) },
  );
  const [created] = await recheck.json();
  console.log(`[keycloak-setup] Cliente "${clientId}" creado.`);
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
// Crea UN usuario de prueba (ver TEST_USERS, mas arriba), SOLO si no existe,
// y le fija una contraseña PERMANENTE (temporary: false, para que no pida
// cambiarla en el primer login durante las pruebas).
// ----------------------------------------------------------------------------
async function ensureTestUser(adminToken, testUser) {
  const list = await fetch(
    `${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/users?username=${encodeURIComponent(testUser.username)}`,
    { headers: adminHeaders(adminToken) },
  );
  const existing = await list.json();

  if (existing.length > 0) {
    console.log(`[keycloak-setup] El usuario de prueba "${testUser.username}" ya existia.`);
    return;
  }

  const create = await fetch(`${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/users`, {
    method: 'POST',
    headers: adminHeaders(adminToken),
    body: JSON.stringify({
      username: testUser.username,
      email: testUser.email,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      enabled: true,
      emailVerified: true,
      credentials: [
        { type: 'password', value: testUser.password, temporary: false },
      ],
    }),
  });

  if (!create.ok) {
    throw new Error(
      `No se pudo crear el usuario de prueba (HTTP ${create.status}).`,
    );
  }
  console.log(`[keycloak-setup] Usuario de prueba "${testUser.username}" creado.`);
}

main().catch((err) => {
  console.error('[keycloak-setup] Error:', err.message);
  process.exit(1);
});
