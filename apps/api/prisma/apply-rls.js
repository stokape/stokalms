// ============================================================================
// apply-rls.js — Aplica prisma/rls-policies.sql contra la base de datos.
//
// Por que existe como script de Node y no como una migracion de Prisma mas:
// Prisma SI soporta incluir SQL "crudo" dentro de una migracion generada,
// pero mezclar eso obligaria a regenerar manualmente el archivo de migracion
// cada vez que cambie el modelo. Separarlo en un script propio, ejecutado
// DESPUES de cada "prisma migrate dev", mantiene el archivo de politicas
// (rls-policies.sql) como una sola fuente de verdad facil de leer y de
// versionar, sin mezclarse con el SQL auto-generado de Prisma.
//
// Como se usa: "npm run prisma:rls" (ver el script en apps/api/package.json).
// Requiere que las tablas YA existan (es decir, que ya se haya corrido
// "npm run prisma:migrate" al menos una vez).
//
// NOTA sobre variables de entorno: a diferencia del CLI de Prisma (que carga
// ".env" automaticamente), este es un script de Node "a secas". El script en
// package.json lo invoca como "node --env-file=.env prisma/apply-rls.js" —
// esa bandera "--env-file" (nativa de Node 20+, sin depender del paquete
// "dotenv") es la que realmente carga DATABASE_URL antes de que este archivo
// se ejecute.
// ============================================================================

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  // Lee la cadena de conexion desde la misma variable de entorno que usa
  // Prisma (DATABASE_URL, definida en ".env" — ver .env.example en la raiz).
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('[apply-rls] Falta la variable de entorno DATABASE_URL.');
    process.exit(1);
  }

  // Lee el archivo de politicas como texto plano, tal cual esta en el repo.
  const sqlPath = path.join(__dirname, 'rls-policies.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  const client = new Client({ connectionString });
  await client.connect();

  try {
    // "CREATE POLICY" falla si la politica ya existe (no tiene "IF NOT
    // EXISTS" en PostgreSQL). Como este script puede correrse varias veces
    // durante el desarrollo (cada vez que se resetea la base de datos local),
    // primero borramos las politicas anteriores para poder recrearlas limpias.
    console.log('[apply-rls] Limpiando politicas anteriores (si existen)...');
    await dropExistingPolicies(client);

    console.log('[apply-rls] Aplicando prisma/rls-policies.sql...');
    await client.query(sql);

    console.log('[apply-rls] Row-Level Security aplicada correctamente.');
  } finally {
    await client.end();
  }
}

// Recorre pg_policies (una tabla del catalogo interno de PostgreSQL que
// lista todas las politicas RLS existentes) y elimina las que este script
// creo anteriormente, identificadas por el nombre fijo "tenant_isolation"
// que usamos en rls-policies.sql para todas las tablas.
async function dropExistingPolicies(client) {
  const { rows } = await client.query(
    `SELECT schemaname, tablename FROM pg_policies WHERE policyname = 'tenant_isolation'`,
  );

  for (const row of rows) {
    // Los nombres de tabla vienen del catalogo de Postgres, no de un input
    // externo del usuario, por lo que interpolarlos aqui es seguro (no es
    // un dato que llegue desde una request HTTP).
    await client.query(
      `DROP POLICY tenant_isolation ON ${row.schemaname}.${row.tablename}`,
    );
  }
}

main().catch((err) => {
  console.error('[apply-rls] Error aplicando las politicas:', err);
  process.exit(1);
});
