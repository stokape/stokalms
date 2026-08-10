// ============================================================================
// setup-keycloak.js — Configura Keycloak por codigo. Sirve TANTO para
// desarrollo local (valores por defecto de abajo) COMO para produccion
// (ver docs/deploy/produccion.md, que lo corre una vez pasandole las
// variables de entorno reales) — la diferencia entre uno y otro caso es
// pura configuracion via variables de entorno, nunca codigo distinto.
//
// POR QUE UN SCRIPT Y NO CONFIGURARLO A MANO EN LA CONSOLA WEB:
// Keycloak (ver docker-compose.yml y docs/architecture/adr/ADR-003-auth-identity.md)
// inicia "en blanco": solo trae el realm "master" para administrarlo a el
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

// Origen PUBLICO del frontend (a donde Keycloak redirige de vuelta despues
// del login/logout, ver mas abajo "redirectUris"/"webOrigins") — en
// desarrollo es siempre "http://localhost:3000"; en produccion, la URL real
// del sitio (ver WEB_ORIGIN en docs/deploy/produccion.md), NUNCA localhost.
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:3000';

// Credenciales del ADMINISTRADOR de Keycloak (no confundir con un usuario de
// la aplicacion): en desarrollo son las mismas que inician el contenedor en
// docker-compose.yml (KEYCLOAK_ADMIN / KEYCLOAK_ADMIN_PASSWORD); en
// produccion vienen de KEYCLOAK_ADMIN_USER/KEYCLOAK_ADMIN_PASSWORD
// (docker-compose.prod.yml, que a su vez inicia el contenedor con esas
// mismas credenciales) — nunca hardcodeadas ahi.
const ADMIN_USER = process.env.KEYCLOAK_ADMIN_USER ?? 'admin';
const ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD ?? 'admin_dev_password';

// Las 7 cuentas de prueba de abajo (contraseñas publicadas en este mismo
// archivo) son solo para desarrollo — jamas deben terminar en un Keycloak
// real con instituciones reales. "docs/deploy/produccion.md" corre este
// script con KEYCLOAK_SEED_TEST_USERS=false explicitamente.
const SEED_TEST_USERS = process.env.KEYCLOAK_SEED_TEST_USERS !== 'false';

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
  await ensureBruteForceProtection(adminToken);
  await ensureBranding(adminToken);

  const apiClientUuid = await ensureClient(adminToken, CLIENT_ID, {
    // El backend SI necesita "password grant" (ver mas abajo) para poder
    // probar el login por script/curl sin un navegador de por medio.
    directAccessGrantsEnabled: true,
    redirectUris: [`${WEB_ORIGIN}/*`],
    webOrigins: [WEB_ORIGIN],
  });
  // Le da a "stoka-api" su propia identidad de "cuenta de servicio" (no la
  // de ninguna persona) con permiso SOLO para crear/editar usuarios del
  // realm — lo que apps/api/src/auth/keycloak-admin.service.ts usa para
  // crear la cuenta de Keycloak de cada institucion nueva al aprobarla
  // (ver tenant-registration.service.ts), sin exponer nunca la contraseña
  // del admin real de Keycloak dentro del backend.
  await ensureAdminServiceAccount(adminToken, apiClientUuid);
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
    redirectUris: [`${WEB_ORIGIN}/api/auth/callback/keycloak`],
    webOrigins: [WEB_ORIGIN],
    // Desde Keycloak 18, el logout "RP-initiated" (redirigir al
    // "end_session_endpoint" para cerrar TAMBIEN la sesion de SSO, no solo
    // la cookie de NextAuth — ver app/(app)/layout.tsx, boton "Cerrar
    // sesion") exige que el "post_logout_redirect_uri" este en esta lista
    // aparte de "redirectUris" de arriba; si no coincide, Keycloak devuelve
    // un error en vez de redirigir de vuelta a la aplicacion.
    attributes: { 'post.logout.redirect.uris': `${WEB_ORIGIN}/*` },
  });
  // "ensureClient" solo CREA si no existia — si alguien corre este script
  // sobre un Keycloak que ya tenia el cliente "stoka-web" de ANTES de que
  // se agregara el logout RP-initiated, el atributo de arriba nunca se
  // aplicaria. Este paso lo actualiza de todas formas, siempre, sin
  // importar si el cliente era nuevo o ya existia (PUT es idempotente).
  await ensureClientAttributes(adminToken, webClientUuid, {
    'post.logout.redirect.uris': `${WEB_ORIGIN}/*`,
  });
  const webClientSecret = await getClientSecret(adminToken, webClientUuid);

  if (SEED_TEST_USERS) {
    for (const testUser of TEST_USERS) {
      await ensureTestUser(adminToken, testUser);
    }
  } else {
    console.log('[keycloak-setup] KEYCLOAK_SEED_TEST_USERS=false: se omiten las cuentas de prueba.');
  }

  console.log('\n[keycloak-setup] Listo. Resumen:');
  console.log(`  Realm:               ${REALM_NAME}`);
  console.log(`  Cliente backend:     ${CLIENT_ID}`);
  console.log(`  Secreto backend:     ${apiClientSecret}`);
  console.log(`  Cliente frontend:    ${WEB_CLIENT_ID}`);
  console.log(`  Secreto frontend:    ${webClientSecret}`);
  if (SEED_TEST_USERS) {
    for (const testUser of TEST_USERS) {
      console.log(`  Usuario de prueba:   ${testUser.username} / ${testUser.password}`);
    }
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
      // "none" en desarrollo local (todo corre sobre http://localhost); en
      // produccion, "external" exige HTTPS para cualquier request que NO
      // venga de la propia red interna (Caddy YA sirve todo bajo TLS
      // ahi, ver Caddyfile, asi que esto nunca deberia rechazar trafico
      // real, solo endurece contra alguien pegandole directo por HTTP).
      sslRequired: WEB_ORIGIN.startsWith('https://') ? 'external' : 'none',
      registrationAllowed: false,
      // Tema propio con el enlace "Volver" y los colores de marca en las
      // pantallas de login (ver keycloak-themes/stoka/) y el nombre que
      // Keycloak muestra en vez de "stoka-dev" — "ensureBranding" de mas
      // abajo vuelve a fijar ambos igual en un realm que ya existia de antes.
      loginTheme: 'stoka',
      displayName: 'Stoka LMS',
    }),
  });

  if (!create.ok) {
    throw new Error(`No se pudo crear el realm "${REALM_NAME}" (HTTP ${create.status}).`);
  }
  console.log(`[keycloak-setup] Realm "${REALM_NAME}" creado.`);
}

// ----------------------------------------------------------------------------
// Fija "loginTheme: stoka" y "displayName: Stoka LMS" (ver
// keycloak-themes/stoka/) SIEMPRE, no solo la primera vez que se crea el
// realm — mismo motivo/patron que ensureBruteForceProtection: un realm
// creado ANTES de que esto existiera nunca lo tendria si esto solo
// corriera dentro de "ensureRealm". "displayName" es lo que Keycloak
// muestra en el encabezado y en el <title> de la pestaña del navegador en
// vez del nombre tecnico del realm ("stoka-dev") — un ajuste de realm
// estandar de Keycloak, no algo propio de este tema.
// ----------------------------------------------------------------------------
async function ensureBranding(adminToken) {
  const get = await fetch(`${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}`, {
    headers: adminHeaders(adminToken),
  });
  const realm = await get.json();

  const update = await fetch(`${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}`, {
    method: 'PUT',
    headers: adminHeaders(adminToken),
    body: JSON.stringify({ ...realm, loginTheme: 'stoka', displayName: 'Stoka LMS' }),
  });

  if (!update.ok) {
    throw new Error(`No se pudo activar la marca "Stoka LMS" en el realm (HTTP ${update.status}).`);
  }
  console.log('[keycloak-setup] Tema de login "stoka" y nombre "Stoka LMS" activados.');
}

// ----------------------------------------------------------------------------
// Activa "Brute Force Detection" del realm: el equivalente REAL a "limitar
// login a 5 peticiones por minuto por IP" que pide una auditoria de
// seguridad tipica — pero aca no aplica como rate limit del backend porque
// este proyecto NO TIENE un endpoint propio de login (ver
// docs/architecture/adr/ADR-003-auth-identity.md): el formulario de
// usuario/contraseña lo sirve y procesa Keycloak, no NestJS ni Next.js. Por
// eso la proteccion contra fuerza bruta va CONFIGURADA EN KEYCLOAK, no en
// codigo de la aplicacion.
//
// A diferencia de "ensureRealm" (que solo actua la PRIMERA vez que el realm
// se crea), esto corre siempre: si alguien ya tiene el realm de antes sin
// esta proteccion, un "npm run keycloak:setup" la agrega igual — mismo
// patron de "leer todo, mezclar, mandar todo de vuelta" que
// ensureClientAttributes (Keycloak tampoco tiene un PATCH parcial de realm).
// ----------------------------------------------------------------------------
async function ensureBruteForceProtection(adminToken) {
  const get = await fetch(`${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}`, {
    headers: adminHeaders(adminToken),
  });
  const realm = await get.json();

  const update = await fetch(`${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}`, {
    method: 'PUT',
    headers: adminHeaders(adminToken),
    body: JSON.stringify({
      ...realm,
      bruteForceProtected: true,
      // 5 intentos fallidos SEGUIDOS (no una ventana de tiempo fija, asi
      // funciona Keycloak) — el numero que pidio la auditoria de seguridad
      // para "login".
      failureFactor: 5,
      // Bloqueo TEMPORAL (no permanente): tras 5 fallos, esa cuenta queda
      // sin poder intentar de nuevo por 60s, duplicandose en cada fallo
      // posterior hasta el techo de "maxFailureWaitSeconds" — evita que un
      // atacante siga probando en rafaga sin dejar a la persona real
      // bloqueada para siempre por un ataque ajeno.
      permanentLockout: false,
      waitIncrementSeconds: 60,
      maxFailureWaitSeconds: 900,
      quickLoginCheckMilliSeconds: 1000,
      minimumQuickLoginWaitSeconds: 60,
      maxDeltaTimeSeconds: 43200,
    }),
  });

  if (!update.ok) {
    throw new Error(
      `No se pudo activar "brute force detection" en el realm (HTTP ${update.status}).`,
    );
  }
  console.log('[keycloak-setup] Deteccion de fuerza bruta activada (5 intentos / bloqueo temporal).');
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

// Roles del cliente interno "realm-management" que se le dan al service
// account de "stoka-api" — ver keycloak-admin.service.ts, quien los usa:
//   - "manage-users": crear la cuenta de cada institucion nueva al
//     aprobarla.
//   - "manage-clients": registrarle a "stoka-web" el redirect_uri de esa
//     misma institucion (su propio subdominio) — SIN esto, esa cuenta
//     recien creada no podia iniciar sesion nunca (Keycloak rechaza
//     cualquier redirect_uri que no este en la lista EXACTA del cliente,
//     sin comodines en la parte del subdominio — ver la nota extensa en
//     tenant-registration.service.ts). Es un salto de privilegio real
//     (puede reconfigurar CUALQUIER cliente del realm, no solo agregar un
//     redirect_uri) — se decidio asumirlo a proposito, avisado, en vez de
//     seguir agregando cada institucion nueva a mano.
const SERVICE_ACCOUNT_ROLES = ['manage-users', 'manage-clients'];

// ----------------------------------------------------------------------------
// Le da a "stoka-api" una identidad DE SERVICIO (no de ninguna persona), con
// los roles de arriba — lo minimo que necesita
// apps/api/src/auth/keycloak-admin.service.ts para aprovisionar una
// institucion nueva de punta a punta (cuenta + login funcionando), sin
// tener que guardar en ningun lado la contraseña del admin real de
// Keycloak. Corre siempre (mismo patron que
// ensureBranding/ensureBruteForceProtection): un "stoka-api" creado ANTES
// de que esto existiera nunca lo tendria si esto solo corriera dentro de
// "ensureClient".
// ----------------------------------------------------------------------------
async function ensureAdminServiceAccount(adminToken, apiClientUuid) {
  const getClient = await fetch(
    `${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/clients/${apiClientUuid}`,
    { headers: adminHeaders(adminToken) },
  );
  const client = await getClient.json();

  if (!client.serviceAccountsEnabled) {
    const update = await fetch(
      `${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/clients/${apiClientUuid}`,
      {
        method: 'PUT',
        headers: adminHeaders(adminToken),
        body: JSON.stringify({ ...client, serviceAccountsEnabled: true }),
      },
    );
    if (!update.ok) {
      throw new Error(
        `No se pudo activar el service account de "stoka-api" (HTTP ${update.status}).`,
      );
    }
  }

  // El usuario "de sistema" que Keycloak crea para ese service account
  // (service-account-stoka-api) — el rol se le asigna a EL, no al cliente.
  const svcUserResp = await fetch(
    `${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/clients/${apiClientUuid}/service-account-user`,
    { headers: adminHeaders(adminToken) },
  );
  if (!svcUserResp.ok) {
    throw new Error(
      `No se pudo obtener el usuario de servicio de "stoka-api" (HTTP ${svcUserResp.status}).`,
    );
  }
  const svcUser = await svcUserResp.json();

  const realmMgmtResp = await fetch(
    `${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/clients?clientId=realm-management`,
    { headers: adminHeaders(adminToken) },
  );
  const [realmMgmtClient] = await realmMgmtResp.json();

  const rolesToAssign = [];
  for (const roleName of SERVICE_ACCOUNT_ROLES) {
    const roleResp = await fetch(
      `${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/clients/${realmMgmtClient.id}/roles/${roleName}`,
      { headers: adminHeaders(adminToken) },
    );
    if (!roleResp.ok) {
      throw new Error(`No se encontro el rol "${roleName}" (HTTP ${roleResp.status}).`);
    }
    rolesToAssign.push(await roleResp.json());
  }

  // Asignar un rol que la cuenta YA tiene no es un error en Keycloak (el
  // POST es idempotente) — no hace falta comprobar antes si ya lo tenia.
  const assign = await fetch(
    `${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/users/${svcUser.id}/role-mappings/clients/${realmMgmtClient.id}`,
    {
      method: 'POST',
      headers: adminHeaders(adminToken),
      body: JSON.stringify(rolesToAssign),
    },
  );
  if (!assign.ok) {
    throw new Error(
      `No se pudieron asignar los roles [${SERVICE_ACCOUNT_ROLES.join(', ')}] al service account de "stoka-api" (HTTP ${assign.status}).`,
    );
  }

  console.log(
    `[keycloak-setup] Service account de "stoka-api" listo (${SERVICE_ACCOUNT_ROLES.join(', ')} via Admin API).`,
  );
}

// ----------------------------------------------------------------------------
// Fusiona "attributes" nuevos en un cliente YA EXISTENTE (a diferencia de
// "ensureClient", que solo actua la primera vez que el cliente se crea).
// Keycloak no tiene un "PATCH" parcial para clientes: hay que leer la
// representacion completa, mezclar los atributos nuevos encima, y mandar
// TODO de vuelta con PUT — mandar solo "attributes" borraria el resto de la
// configuracion del cliente (redirectUris, etc.) sin querer.
// ----------------------------------------------------------------------------
async function ensureClientAttributes(adminToken, clientUuid, attributes) {
  const get = await fetch(
    `${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/clients/${clientUuid}`,
    { headers: adminHeaders(adminToken) },
  );
  const client = await get.json();

  const update = await fetch(
    `${KEYCLOAK_BASE_URL}/admin/realms/${REALM_NAME}/clients/${clientUuid}`,
    {
      method: 'PUT',
      headers: adminHeaders(adminToken),
      body: JSON.stringify({
        ...client,
        attributes: { ...client.attributes, ...attributes },
      }),
    },
  );

  if (!update.ok) {
    throw new Error(`No se pudieron actualizar los atributos del cliente (HTTP ${update.status}).`);
  }
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
