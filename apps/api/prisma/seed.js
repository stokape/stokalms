// ============================================================================
// seed.js — Datos iniciales imprescindibles para poder probar la plataforma:
// el catalogo de permisos, los roles base del sistema (ver
// docs/architecture/03-rbac.md) y un tenant de desarrollo.
//
// POR QUE SE CONECTA CON EL USUARIO ADMINISTRADOR (DATABASE_URL) Y NO CON EL
// RESTRINGIDO (RUNTIME_DATABASE_URL): sembrar roles/permisos DEL SISTEMA
// (tenant_id = null) y crear el primer tenant son operaciones de inicio de
// la plataforma, no acciones de un tenant ya existente — no hay todavia
// ningun "tenant activo" que fijar para Row-Level Security (ver
// rls-policies.sql). Es el mismo tipo de operacion que una migracion:
// administrativa, no de negocio en tiempo real.
//
// Como se usa: "npm run prisma:seed" (ver el script en package.json).
// Requiere que las migraciones y las politicas RLS YA se hayan aplicado.
// ============================================================================

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ----------------------------------------------------------------------------
// Catalogo GLOBAL de permisos (tabla "permissions", ver schema.prisma). Cada
// permiso es un par "recurso:accion", igual para toda la plataforma — lo que
// varia por tenant es que ROL tiene asignado cada uno (ver ROLE_PERMISSIONS
// mas abajo y docs/architecture/03-rbac.md, seccion 3.1).
// ----------------------------------------------------------------------------
const PERMISSIONS = [
  ['tenant', 'view'], ['tenant', 'edit'], ['tenant', 'manage_roles'], ['tenant', 'manage_features'],
  ['term', 'view'], ['term', 'create'], ['term', 'edit'], ['term', 'delete'],
  ['course', 'view'], ['course', 'create'], ['course', 'edit'], ['course', 'delete'],
  ['section', 'view'], ['section', 'create'], ['section', 'edit'], ['section', 'delete'],
  ['module', 'view'], ['module', 'create'], ['module', 'edit'], ['module', 'delete'],
  ['lesson', 'view'], ['lesson', 'create'], ['lesson', 'edit'], ['lesson', 'delete'],
  ['resource', 'view'], ['resource', 'create'], ['resource', 'edit'], ['resource', 'delete'],
  ['enrollment', 'view'], ['enrollment', 'create'], ['enrollment', 'delete'], ['enrollment', 'bulk_import'],
  ['grading_scale', 'view'], ['grading_scale', 'create'], ['grading_scale', 'edit'], ['grading_scale', 'delete'],
  ['gradebook_category', 'view'], ['gradebook_category', 'create'], ['gradebook_category', 'edit'], ['gradebook_category', 'delete'],
  ['assessment', 'view'], ['assessment', 'create'], ['assessment', 'edit'], ['assessment', 'delete'], ['assessment', 'publish'],
  ['submission', 'view'], ['submission', 'create'], ['submission', 'grade'],
  ['grade', 'view'], ['grade', 'view_own'], ['grade', 'edit'], ['grade', 'publish'],
  ['certificate', 'view'], ['certificate', 'view_own'], ['certificate', 'issue'], ['certificate', 'revoke'],
  ['certificate_template', 'view'], ['certificate_template', 'create'], ['certificate_template', 'edit'], ['certificate_template', 'delete'],
  ['attendance', 'view'], ['attendance', 'create'], ['attendance', 'edit'],
  ['student_note', 'view'], ['student_note', 'create'], ['student_note', 'edit'], ['student_note', 'delete'],
  ['enrollment_attachment', 'view'], ['enrollment_attachment', 'create'],
  ['user_profile', 'edit'],
  ['student_progress', 'view'],
  ['role', 'view'], ['role', 'create'], ['role', 'edit'], ['role', 'delete'], ['role', 'assign'],
  // Panel (ver dashboard.controller.ts) — "view" alcanza para los widgets
  // basicos; los widgets "empresariales" (mas ampios) se gatean aparte con
  // "tenant:edit" (ya exclusivo de Super Admin/Administrador de entidad),
  // no con un permiso nuevo — mismo criterio que mantenimiento/dominios.
  ['dashboard', 'view'],
  // Reportes (asistencia, notas, avance de matricula) — ver reports.controller.ts.
  ['report', 'view'], ['report', 'export'],
  // Cohortes (ver cohort.controller.ts) — agrupar alumnos para matricular y
  // reportar en bloque.
  ['cohort', 'view'], ['cohort', 'create'], ['cohort', 'edit'], ['cohort', 'delete'], ['cohort', 'assign'],
  // Auditoria (ver security.controller.ts) — "seguridad avanzada" (plan
  // Enterprise). Solo lo tienen Super Admin/Administrador de entidad (via
  // ALL_PERMISSIONS mas abajo): ningun otro rol lo tiene explicito, mismo
  // criterio que "tenant:edit".
  ['audit', 'view'], ['audit', 'export'],
];

// Atajo para no repetir "todos los permisos" al armar Super Admin / Admin
// de entidad, que segun docs/architecture/03-rbac.md tienen acceso total.
const ALL_PERMISSIONS = PERMISSIONS;

// ----------------------------------------------------------------------------
// Roles BASE del sistema (tabla "roles" con tenant_id = null, ver
// schema.prisma y 03-rbac.md, seccion 3.2). Cada entrada es
// [nombre, lista de permisos [recurso, accion]].
// ----------------------------------------------------------------------------
const SYSTEM_ROLES = [
  ['Super Admin', ALL_PERMISSIONS],
  ['Administrador de entidad', ALL_PERMISSIONS],
  [
    'Coordinador académico',
    [
      ['term', 'view'], ['term', 'create'], ['term', 'edit'], ['term', 'delete'],
      ['course', 'view'], ['course', 'create'], ['course', 'edit'], ['course', 'delete'],
      ['section', 'view'], ['section', 'create'], ['section', 'edit'], ['section', 'delete'],
      ['enrollment', 'view'], ['enrollment', 'create'], ['enrollment', 'delete'], ['enrollment', 'bulk_import'],
      // Sustento (archivo de respaldo) al cambiar el estado de una
      // matrícula — ver enrollment-attachment.controller.ts.
      ['enrollment_attachment', 'view'], ['enrollment_attachment', 'create'],
      ['gradebook_category', 'view'],
      // Contenido de un curso: a diferencia del diseño original (solo
      // "view", contenido gestionado exclusivamente por el Docente), el
      // Coordinador ahora también puede crear/editar/borrar módulos,
      // lecciones y recursos — pensado como CONTINGENCIA para dar de alta
      // un curso completo (módulos, clases, material) incluso antes de
      // que haya un Docente asignado, o si el Docente todavía no cargó
      // nada. Sigue sin poder tocar Evaluaciones (eso es exclusivo del
      // Docente, ver "assessment" — no está en esta lista a propósito).
      ['module', 'view'], ['module', 'create'], ['module', 'edit'], ['module', 'delete'],
      ['lesson', 'view'], ['lesson', 'create'], ['lesson', 'edit'], ['lesson', 'delete'],
      ['resource', 'view'], ['resource', 'create'], ['resource', 'edit'], ['resource', 'delete'],
      ['grade', 'view'], ['certificate', 'view'], ['certificate', 'issue'], ['certificate', 'revoke'],
      ['certificate_template', 'view'], ['certificate_template', 'create'], ['certificate_template', 'edit'], ['certificate_template', 'delete'],
      // Editar los datos de contacto/residencia de un alumno (no los
      // propios — eso ya lo cubre "Mi perfil" para cualquier rol) — ver
      // user-management/profile-edit.controller.ts.
      ['user_profile', 'edit'],
      // Ver el registro de asistencia y el progreso de cada alumno
      // (lecciones vistas, evaluaciones rendidas, asistencia, nota
      // parcial) — ver academic-progress módulo. Sin "attendance:create":
      // sigue sin poder TOMAR asistencia, solo verla (eso es del Docente).
      ['attendance', 'view'],
      ['student_progress', 'view'],
      // Panel y reportes (ver dashboard.controller.ts, reports.controller.ts)
      // — mismo alcance de tenant que ya tiene para notas/asistencia arriba.
      ['dashboard', 'view'],
      ['report', 'view'], ['report', 'export'],
      // Cohortes: puede VER y ASIGNAR alumnos a una cohorte existente (para
      // matricular en bloque) pero no crear/editar/borrar la cohorte en si
      // — eso es una decision estructural de la institucion, reservada a
      // Administrador de entidad/Super Admin (mismo criterio que roles).
      ['cohort', 'view'], ['cohort', 'assign'],
    ],
  ],
  [
    'Docente',
    [
      ['course', 'view'],
      // "section:view" (sin create/edit/delete): sin esto no puede ni
      // siquiera LLEGAR a la pantalla de matriculados de una seccion (ver
      // cursos/[courseId]/page.tsx, frontend) — detectado probando de
      // verdad con el usuario de prueba "docente@stoka-lms.test": sin este
      // permiso, la lista de secciones del curso queda oculta y toda la
      // asistencia/anotaciones/certificados de este rol son inalcanzables.
      ['section', 'view'],
      // "enrollment:view" (sin create/delete): el Docente puede VER quien
      // esta matriculado en sus secciones (para tomar asistencia, dejar
      // anotaciones, ver certificados) pero matricular/retirar alumnos
      // sigue siendo trabajo del Coordinador académico — ver la nota en
      // secciones/[sectionId]/page.tsx (frontend) sobre por que esos
      // formularios se ocultan para este rol aunque la pantalla sea
      // compartida.
      ['enrollment', 'view'],
      ['module', 'view'], ['module', 'create'], ['module', 'edit'], ['module', 'delete'],
      ['lesson', 'view'], ['lesson', 'create'], ['lesson', 'edit'], ['lesson', 'delete'],
      ['resource', 'view'], ['resource', 'create'], ['resource', 'edit'], ['resource', 'delete'],
      ['gradebook_category', 'view'], ['gradebook_category', 'create'], ['gradebook_category', 'edit'], ['gradebook_category', 'delete'],
      ['assessment', 'view'], ['assessment', 'create'], ['assessment', 'edit'], ['assessment', 'delete'], ['assessment', 'publish'],
      ['submission', 'view'], ['submission', 'grade'],
      ['grade', 'view'], ['grade', 'edit'], ['grade', 'publish'],
      ['attendance', 'view'], ['attendance', 'create'], ['attendance', 'edit'],
      // El Docente NO emite certificados el mismo (eso quedo en
      // Coordinador/Admin, ver ["certificate","issue"] mas arriba en esos
      // roles) — solo necesita VER cuales de sus alumnos ya lo obtuvieron.
      ['certificate', 'view'],
      ['certificate_template', 'view'],
      ['student_note', 'view'], ['student_note', 'create'], ['student_note', 'edit'], ['student_note', 'delete'],
      // Panel y reportes — mismo alcance de tenant que ya tiene para
      // notas/asistencia de arriba (ver la nota en Coordinador académico
      // sobre por que no hay "solo mis secciones": ese recorte no existe
      // hoy en ningun otro permiso del Docente tampoco).
      ['dashboard', 'view'],
      ['report', 'view'], ['report', 'export'],
    ],
  ],
  [
    'Estudiante',
    [
      ['course', 'view'], ['module', 'view'], ['lesson', 'view'], ['resource', 'view'],
      ['assessment', 'view'], ['submission', 'view'], ['submission', 'create'],
      ['grade', 'view_own'], ['certificate', 'view_own'],
    ],
  ],
  [
    'Padre/Apoderado',
    [
      ['course', 'view'], ['grade', 'view_own'], ['attendance', 'view'], ['certificate', 'view'],
    ],
  ],
  [
    'Auditor/Invitado',
    [
      ['course', 'view'], ['term', 'view'], ['enrollment', 'view'], ['grade', 'view'],
      ['attendance', 'view'], ['certificate', 'view'],
      // Ve todo, no cambia nada — panel y reportes en modo lectura encajan
      // exactamente con el proposito de este rol.
      ['dashboard', 'view'],
      ['report', 'view'], ['report', 'export'],
    ],
  ],
];

// ----------------------------------------------------------------------------
// Tenant de DESARROLLO para poder probar login, matricula, etc. de punta a
// punta sin tener que dar de alta una institucion real todavia. Su dominio
// es "sanmartin.localhost" -- UN SUBDOMINIO, nunca el dominio raiz desnudo
// ("localhost") -- para que la topologia de desarrollo sea la MISMA que en
// produccion: el dominio raiz (ver PLATFORM_ROOT_DOMAIN) siempre muestra la
// landing de LA PLATAFORMA (ver PlatformLanding.tsx), nunca la de una
// institucion en particular. Antes este tenant tambien reclamaba "localhost"
// a secas, lo que tapaba la landing real en desarrollo y fue la causa de
// bastante confusion probando el flujo "Iniciar sesion -> /entrar" (¿cual es
// el tenant si YA estoy parado en uno?). Se puede seguir entrando a este
// tenant escribiendo "sanmartin" en /entrar, o visitando
// "http://sanmartin.localhost:3000" directo -- los navegadores modernos
// resuelven cualquier "*.localhost" solos (RFC 6761), sin tocar el archivo
// de hosts (ver docs/architecture/01-arquitectura-alto-nivel.md, seccion 1.4).
// ----------------------------------------------------------------------------
const DEV_TENANT = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Instituto San Martín (desarrollo)',
  domains: ['sanmartin.localhost'],
};

async function main() {
  console.log('[seed] Sembrando catalogo de permisos...');
  for (const [resource, action] of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { resource_action: { resource, action } },
      update: {},
      create: { resource, action },
    });
  }

  console.log('[seed] Sembrando roles base del sistema...');
  for (const [roleName, rolePermissions] of SYSTEM_ROLES) {
    const role = await prisma.role.upsert({
      // Los roles del sistema tienen tenantId null; Prisma no permite un
      // "where" compuesto con un campo nulo de forma directa, por eso se
      // busca primero y se decide crear/reusar a mano en vez de un solo upsert.
      where: { id: await findSystemRoleId(roleName) },
      update: {},
      create: { name: roleName, isSystemRole: true, tenantId: null },
    });

    const currentPermissionIds = [];
    for (const [resource, action] of rolePermissions) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { resource_action: { resource, action } },
      });
      currentPermissionIds.push(permission.id);
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }

    // Este seed es DECLARATIVO, no solo aditivo: si un permiso se QUITA de
    // la lista de SYSTEM_ROLES de arriba (como paso con Estudiante,
    // "certificate:view" -> "certificate:view_own"), hay que borrar
    // tambien la asignacion vieja — de lo contrario queda viva para
    // siempre en la base de datos, porque el "upsert" de arriba solo sabe
    // AGREGAR, nunca QUITAR. Se detecto este bug probando de verdad: un
    // estudiante seguia viendo certificados ajenos despues de angostar su
    // permiso, porque el rol todavia tenia la fila vieja de "view" sin
    // que nadie la hubiera borrado.
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id, permissionId: { notIn: currentPermissionIds } },
    });

    console.log(`  - ${roleName}: ${rolePermissions.length} permisos`);
  }

  console.log('[seed] Sembrando tenant de desarrollo...');
  await prisma.tenant.upsert({
    where: { id: DEV_TENANT.id },
    update: {},
    create: { id: DEV_TENANT.id, name: DEV_TENANT.name },
  });

  for (const domain of DEV_TENANT.domains) {
    const isPrimary = domain === DEV_TENANT.domains[0];
    await prisma.tenantDomain.upsert({
      where: { domain },
      // "isPrimary" tambien va en "update", no solo en "create": una fila
      // que YA existia (como "sanmartin.localhost", que antes era la
      // secundaria mientras "localhost" era la principal) tiene que poder
      // volverse principal si la lista de arriba cambia -- si no, el
      // dominio de este tenant queda sin ninguna fila "principal", y
      // "/dominios" (autoservicio, ver tenant-domain.service.ts,
      // "removeDomain") dejaria borrarla por error al no detectarla como
      // la unica forma de entrar a esta institucion.
      update: { tenantId: DEV_TENANT.id, isPrimary },
      create: { domain, tenantId: DEV_TENANT.id, isPrimary },
    });
  }
  // Mismo patron "declarativo" que SYSTEM_ROLES mas arriba: si un dominio se
  // QUITA de DEV_TENANT.domains (como paso con "localhost" a secas, ver la
  // nota de arriba), hay que borrar tambien su fila vieja -- si no, se queda
  // reclamando ese dominio para siempre y la landing de la plataforma nunca
  // se ve en "http://localhost:3000".
  await prisma.tenantDomain.deleteMany({
    where: { tenantId: DEV_TENANT.id, domain: { notIn: DEV_TENANT.domains } },
  });

  console.log('[seed] Listo.');
}

// Prisma no tiene un "upsert por campo unico compuesto que incluye NULL" de
// fabrica (tenantId es NULL en los roles del sistema, y Prisma no arma un
// indice unico util sobre eso); por eso este helper hace la busqueda a mano.
async function findSystemRoleId(name) {
  const existing = await prisma.role.findFirst({
    where: { name, isSystemRole: true, tenantId: null },
    select: { id: true },
  });
  // Si no existe, se devuelve un id que NUNCA va a hacer match en el
  // "where" del upsert de arriba, forzando la rama "create". Un uuid al
  // azar cumple ese proposito sin necesitar una consulta adicional.
  return existing?.id ?? '00000000-0000-0000-0000-000000000000';
}

main()
  .catch((err) => {
    console.error('[seed] Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
