// ============================================================================
// seed.js — Datos iniciales imprescindibles para poder probar la plataforma:
// el catalogo de permisos, los roles base del sistema (ver
// docs/architecture/03-rbac.md) y un tenant de desarrollo.
//
// POR QUE SE CONECTA CON EL USUARIO ADMINISTRADOR (DATABASE_URL) Y NO CON EL
// RESTRINGIDO (RUNTIME_DATABASE_URL): sembrar roles/permisos DEL SISTEMA
// (tenant_id = null) y crear el primer tenant son operaciones de arranque de
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
  ['certificate', 'view'], ['certificate', 'issue'], ['certificate', 'revoke'],
  ['attendance', 'view'], ['attendance', 'create'], ['attendance', 'edit'],
  ['role', 'view'], ['role', 'create'], ['role', 'edit'], ['role', 'delete'], ['role', 'assign'],
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
      ['gradebook_category', 'view'],
      ['module', 'view'], ['lesson', 'view'],
      ['grade', 'view'], ['certificate', 'view'],
    ],
  ],
  [
    'Docente',
    [
      ['course', 'view'],
      ['module', 'view'], ['module', 'create'], ['module', 'edit'], ['module', 'delete'],
      ['lesson', 'view'], ['lesson', 'create'], ['lesson', 'edit'], ['lesson', 'delete'],
      ['resource', 'view'], ['resource', 'create'], ['resource', 'edit'], ['resource', 'delete'],
      ['gradebook_category', 'view'], ['gradebook_category', 'create'], ['gradebook_category', 'edit'], ['gradebook_category', 'delete'],
      ['assessment', 'view'], ['assessment', 'create'], ['assessment', 'edit'], ['assessment', 'delete'], ['assessment', 'publish'],
      ['submission', 'view'], ['submission', 'grade'],
      ['grade', 'view'], ['grade', 'edit'], ['grade', 'publish'],
      ['attendance', 'view'], ['attendance', 'create'], ['attendance', 'edit'],
      ['certificate', 'view'], ['certificate', 'issue'],
    ],
  ],
  [
    'Estudiante',
    [
      ['course', 'view'], ['module', 'view'], ['lesson', 'view'], ['resource', 'view'],
      ['assessment', 'view'], ['submission', 'view'], ['submission', 'create'],
      ['grade', 'view_own'], ['certificate', 'view'],
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
    ],
  ],
];

// ----------------------------------------------------------------------------
// Tenant de DESARROLLO para poder probar login, matricula, etc. de punta a
// punta sin tener que dar de alta una institucion real todavia. Se registran
// DOS dominios apuntando al mismo tenant: "localhost" (para poder probar con
// curl/Postman sin cabeceras especiales) y "sanmartin.localhost" (para
// simular el caso real de subdominio propio, ver
// docs/architecture/01-arquitectura-alto-nivel.md, seccion 1.4).
// ----------------------------------------------------------------------------
const DEV_TENANT = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Instituto San Martín (desarrollo)',
  domains: ['localhost', 'sanmartin.localhost'],
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

    for (const [resource, action] of rolePermissions) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { resource_action: { resource, action } },
      });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
    console.log(`  - ${roleName}: ${rolePermissions.length} permisos`);
  }

  console.log('[seed] Sembrando tenant de desarrollo...');
  await prisma.tenant.upsert({
    where: { id: DEV_TENANT.id },
    update: {},
    create: { id: DEV_TENANT.id, name: DEV_TENANT.name },
  });

  for (const domain of DEV_TENANT.domains) {
    await prisma.tenantDomain.upsert({
      where: { domain },
      update: { tenantId: DEV_TENANT.id },
      create: { domain, tenantId: DEV_TENANT.id, isPrimary: domain === DEV_TENANT.domains[0] },
    });
  }

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
