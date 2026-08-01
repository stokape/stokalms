-- ============================================================================
-- rls-policies.sql — Activa el aislamiento multi-tenant a nivel de base de
-- datos (Row-Level Security de PostgreSQL).
--
-- POR QUE EXISTE ESTE ARCHIVO APARTE DE schema.prisma:
-- Prisma sabe crear tablas, columnas, indices y llaves foraneas, pero NO
-- tiene forma de declarar politicas de seguridad RLS de PostgreSQL. Por eso,
-- despues de cada "npx prisma migrate dev" (que crea/actualiza las tablas),
-- hay que ejecutar este script para que el aislamiento entre tenants quede
-- reforzado por el propio motor de base de datos, no solo por el codigo de
-- la aplicacion (ver docs/architecture/adr/ADR-001-multi-tenancy.md, que
-- explica POR QUE se eligio este mecanismo en vez de confiar solo en que
-- cada consulta de NestJS incluya "WHERE tenant_id = ...").
--
-- COMO SE APLICA: "npm run prisma:rls" (definido en apps/api/package.json),
-- que ejecuta prisma/apply-rls.js, el cual lee este archivo y lo corre
-- contra la base de datos usando DATABASE_URL (.env).
--
-- COMO FUNCIONA EN TIEMPO DE EJECUCION:
-- El backend NestJS, en el middleware de tenant (ver
-- src/common/tenant/tenant-context.middleware.ts) y en PrismaService (ver
-- src/prisma/prisma.service.ts), ejecuta, al inicio de cada transaccion:
--     SELECT set_config('app.current_tenant', '<uuid-del-tenant>', true);
-- El "true" final significa "solo para esta transaccion" (LOCAL); en cuanto
-- la transaccion termina, el valor se olvida — asi una conexion reciclada
-- del pool nunca "hereda" por accidente el tenant de la request anterior.
-- Cada politica de abajo compara "tenant_id" contra ese valor.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- Tablas EXCLUIDAS deliberadamente de RLS (no llevan filtro por tenant_id):
--
--   tenants           -> es la tabla que ENUMERA los tenants; no tiene sentido
--                        que un tenant se "filtre a si mismo".
--   tenant_domains    -> el middleware de resolucion de tenant necesita poder
--                        buscar CUALQUIER dominio (de cualquier tenant) para
--                        saber a que tenant_id corresponde, ANTES de que
--                        exista un "tenant activo" que fijar. Si esta tabla
--                        tuviera RLS, la propia resolucion del tenant fallaria.
--   users             -> la identidad de una persona es GLOBAL (ver
--                        docs/architecture/02-modelo-de-datos.md, 2.2); lo que
--                        SI esta aislado por tenant es "user_tenants".
--   permissions       -> catalogo global de permisos posibles (resource:action),
--                        igual para toda la plataforma, no es dato de un tenant.
--   role_permissions  -> tabla puente de un catalogo global; no expone datos
--                        sensibles de un tenant especifico por si sola.
-- ----------------------------------------------------------------------------


-- Funcion auxiliar reutilizada por todas las politicas de abajo: lee el
-- tenant activo de la transaccion actual. El "true" en current_setting hace
-- que devuelva NULL (en vez de lanzar un error) si nadie fijo el valor
-- todavia — y comparar cualquier tenant_id contra NULL siempre da FALSE, asi
-- que el efecto es "no devolver ninguna fila" en vez de romper la consulta.
-- Esto es una decision de seguridad: ante la duda, no mostrar nada (fail closed).
--
-- Devuelve "text" (no "uuid"): Prisma genera las columnas "id"/"tenant_id"
-- como "String @id @default(uuid())", que en PostgreSQL se traduce a una
-- columna de tipo TEXT que CONTIENE un uuid como texto, no al tipo nativo
-- "uuid" de Postgres. Si esta funcion devolviera "uuid", cada politica de
-- abajo fallaria con el error "operator does not exist: text = uuid" (asi
-- se detecto este detalle: probando la migracion real contra Postgres).
CREATE OR REPLACE FUNCTION app_current_tenant() RETURNS text AS $$
  SELECT current_setting('app.current_tenant', true);
$$ LANGUAGE sql STABLE;


-- ----------------------------------------------------------------------------
-- Plantilla que se repite para cada tabla: activar RLS, forzarla incluso
-- para el dueño de la tabla (FORCE, importante porque por defecto el dueño
-- de una tabla en Postgres se salta las politicas RLS), y crear la politica
-- de aislamiento. Se hace tabla por tabla porque PostgreSQL no tiene forma de
-- aplicar esto en bloque a muchas tablas con un solo comando.
-- ----------------------------------------------------------------------------

-- user_tenants: la membresia de una persona en un tenant.
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON user_tenants
  USING (tenant_id = app_current_tenant());

-- roles: caso especial. tenant_id puede ser NULL (rol base del sistema,
-- compartido por todos) o tener un valor (rol personalizado de ESE tenant).
-- La politica deja pasar ambos casos validos, ver docs/architecture/03-rbac.md.
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON roles
  USING (tenant_id IS NULL OR tenant_id = app_current_tenant());

-- user_roles: que rol tiene cada persona, en que alcance (tenant o curso).
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON user_roles
  USING (tenant_id = app_current_tenant());

-- terms: periodos academicos (semestres/ciclos) propios de cada tenant.
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON terms
  USING (tenant_id = app_current_tenant());

-- courses: cursos de cada tenant.
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON courses
  USING (tenant_id = app_current_tenant());

-- sections: secciones/horarios de un curso.
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sections
  USING (tenant_id = app_current_tenant());

-- modules: modulos de contenido dentro de un curso.
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON modules
  USING (tenant_id = app_current_tenant());

-- lessons: lecciones dentro de un modulo.
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON lessons
  USING (tenant_id = app_current_tenant());

-- resources: videos/PDFs/enlaces/SCORM dentro de una leccion.
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON resources
  USING (tenant_id = app_current_tenant());

-- enrollments: matriculas de estudiantes en secciones.
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON enrollments
  USING (tenant_id = app_current_tenant());

-- gradebook_categories: categorias ponderadas del libro de calificaciones.
ALTER TABLE gradebook_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE gradebook_categories FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON gradebook_categories
  USING (tenant_id = app_current_tenant());

-- assessments: examenes, tareas, foros calificables, rubricas.
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON assessments
  USING (tenant_id = app_current_tenant());

-- questions: preguntas dentro de una evaluacion.
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON questions
  USING (tenant_id = app_current_tenant());

-- submissions: intentos/entregas de un estudiante.
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON submissions
  USING (tenant_id = app_current_tenant());

-- submission_answers: respuesta a cada pregunta dentro de un intento.
ALTER TABLE submission_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_answers FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON submission_answers
  USING (tenant_id = app_current_tenant());

-- grades: nota final calculada de un intento/entrega.
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON grades
  USING (tenant_id = app_current_tenant());

-- grading_scales: escalas de nota propias de cada tenant (vigesimal/centesimal/literal).
ALTER TABLE grading_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_scales FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON grading_scales
  USING (tenant_id = app_current_tenant());

-- attendance_records: registros de asistencia.
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON attendance_records
  USING (tenant_id = app_current_tenant());

-- certificate_templates: plantillas de certificado configuradas por el tenant.
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON certificate_templates
  USING (tenant_id = app_current_tenant());

-- certificates: certificados emitidos.
-- NOTA: el endpoint PUBLICO de verificacion (GET /verify/:codigo, ver
-- docs/architecture/04-flujos-criticos.md, seccion 4.3) NO puede pasar por
-- esta politica porque no conoce el tenant de antemano (alguien externo solo
-- tiene el codigo). Ese endpoint usa la funcion "find_certificate_tenant"
-- definida mas abajo, con permiso BYPASS RLS acotado a esa unica consulta.
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON certificates
  USING (tenant_id = app_current_tenant());

-- ----------------------------------------------------------------------------
-- find_certificate_tenant: bypass ACOTADO de RLS para el endpoint publico de
-- verificacion (GET /verify/:codigo, ver
-- apps/api/src/modules/certificates/verify.service.ts).
--
-- Quien verifica un certificado no tiene sesion ni tenant conocido de
-- antemano — solo tiene el codigo (ej. lo escaneo de un QR impreso). No hay
-- forma de llamar a "withTenant(tenantId, ...)" (que es lo que activa
-- correctamente la politica de arriba) porque todavia no sabemos el
-- tenantId: es exactamente lo que esta funcion averigua.
--
-- "SECURITY DEFINER" hace que la funcion se ejecute con los privilegios de
-- quien la CREO (el usuario administrador "stoka", superusuario que este
-- mismo script usa via DATABASE_URL), no de quien la invoca. Un superusuario
-- se salta RLS siempre (ver la nota extensa sobre "stoka_app" mas abajo en
-- este archivo) — por eso esta funcion SI puede leer "certificates" sin que
-- le aplique la politica "tenant_isolation".
--
-- El riesgo de un SECURITY DEFINER es que expone TODO lo que su cuerpo
-- pueda leer a cualquiera con permiso de EJECUTARLA. Por eso esta funcion
-- devuelve el MINIMO indispensable (un tenant_id, ni siquiera confirma que
-- el codigo exista si no hace falta) y NUNCA los datos del certificado en
-- si. Con ese tenant_id, verify.service.ts abre despues una transaccion
-- normal con "withTenant" (que SI aplica RLS) para leer el certificado
-- completo, dentro del mismo carril de aislamiento que usa el resto del
-- backend — este bypass nunca evita la Row-Level Security del dato en si,
-- solo el primer paso de "a que tenant pertenece este codigo".
CREATE OR REPLACE FUNCTION find_certificate_tenant(p_verification_code text)
RETURNS text AS $$
  SELECT tenant_id FROM certificates WHERE verification_code = p_verification_code;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Sin este GRANT, "stoka_app" (el rol restringido con el que corre el
-- backend, ver mas abajo) no tendria permiso ni para EJECUTAR esta funcion,
-- aunque la funcion en si corra con privilegios de "stoka".
GRANT EXECUTE ON FUNCTION find_certificate_tenant(text) TO stoka_app;

-- tenant_features: interruptores de funciones activas por tenant (feature flags).
ALTER TABLE tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_features FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenant_features
  USING (tenant_id = app_current_tenant());

-- audit_logs: registro de acciones sensibles (ver ADR y 07-infraestructura.md, 7.6).
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON audit_logs
  USING (tenant_id = app_current_tenant());


-- ============================================================================
-- ROL DE APLICACION RESTRINGIDO — esta seccion existe por un detalle de
-- PostgreSQL que NO es obvio y que se descubrio probando esta migracion
-- contra una base de datos real (no es teorico):
--
-- El usuario "stoka" (POSTGRES_USER en docker-compose.yml) es SUPERUSER,
-- porque asi lo crea por defecto la imagen oficial de PostgreSQL. En
-- PostgreSQL, los superusuarios (y cualquier rol con el atributo BYPASSRLS)
-- se SALTAN todas las politicas de Row-Level Security SIEMPRE, sin importar
-- "FORCE ROW LEVEL SECURITY" — esa opcion solo afecta al DUEÑO de la tabla
-- cuando NO es superusuario. Como "stoka" crea las tablas (es su dueño) Y
-- ademas es superuser, las politicas de arriba NO se aplicaban en absoluto
-- al probarlas con ese usuario: todas las consultas veian TODOS los tenants.
--
-- LA SOLUCION es que el BACKEND (NestJS/Prisma en tiempo de ejecucion) se
-- conecte con un rol nuevo, "stoka_app", que:
--   - NO es superusuario.
--   - NO tiene el atributo BYPASSRLS.
--   - Solo tiene permiso para leer/escribir filas (no para crear/borrar
--     tablas): las migraciones (prisma migrate) se siguen corriendo con el
--     usuario "stoka" original, que si necesita permisos amplios para DDL.
--
-- Ver src/config/configuration.ts (variable RUNTIME_DATABASE_URL) y
-- src/prisma/prisma.service.ts, donde el backend usa ESTE rol para toda
-- consulta en tiempo de ejecucion, mientras que DATABASE_URL (con el
-- usuario "stoka") queda reservado para migraciones y para este script.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'stoka_app') THEN
    CREATE ROLE stoka_app WITH LOGIN PASSWORD 'stoka_app_dev_password' NOSUPERUSER NOBYPASSRLS;
  END IF;
END
$$;

-- Permiso para "entrar" al esquema public (sin esto, ni siquiera puede ver
-- que las tablas existen).
GRANT USAGE ON SCHEMA public TO stoka_app;

-- Permiso de lectura/escritura de FILAS (no de estructura) sobre todas las
-- tablas que existen HOY en el esquema.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO stoka_app;

-- Lo mismo, pero para tablas que se creen en FUTURAS migraciones: sin esto,
-- cada "prisma migrate dev" nuevo obligaria a volver a correr este GRANT a
-- mano para la tabla recien creada.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO stoka_app;

-- Necesario si alguna tabla llegara a usar secuencias (ej. contadores
-- autoincrementales); nuestro modelo usa UUIDs, pero se deja por seguridad
-- ante columnas que se agreguen mas adelante.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO stoka_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO stoka_app;
