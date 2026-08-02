# Stoka LMS

Plataforma SaaS multi-tenant de gestión de aprendizaje (LMS) para entidades educativas — institutos, universidades, centros de capacitación y academias.

## Documentación

- [`docs/architecture/`](docs/architecture/README.md) — arquitectura técnica completa (stack, modelo de datos, RBAC, flujos, API, roadmap, infraestructura) con sus [ADRs](docs/architecture/adr/).
- [`docs/guia-para-no-tecnicos.md`](docs/guia-para-no-tecnicos.md) — la misma información explicada sin jerga técnica, con ejemplos.
- [`docs/manuales/`](docs/manuales/README.md) — manuales de USO para personas no técnicas: primeros pasos, uno por rol (Estudiante / Docente-Coordinador-Administrador) y resolución de problemas.

Todo el código de este repositorio implementa las decisiones documentadas ahí — si algo en el código no coincide con esos documentos, uno de los dos está desactualizado y hay que corregirlo.

## Stack elegido para arrancar

| Pieza | Elección | Detalle |
|---|---|---|
| Base de datos | PostgreSQL | Local: Docker. Producción: Neon o Supabase (managed Postgres) — ver [ADR-004](docs/architecture/adr/ADR-004-base-datos.md) |
| Backend | NestJS (TypeScript) + Prisma | Ver [ADR-002](docs/architecture/adr/ADR-002-stack-backend.md) |
| Identidad/SSO | Keycloak | Ver [ADR-003](docs/architecture/adr/ADR-003-auth-identity.md) |
| Aislamiento multi-tenant | PostgreSQL Row-Level Security | Ver [ADR-001](docs/architecture/adr/ADR-001-multi-tenancy.md) |
| Frontend | Next.js 16 (App Router) + NextAuth.js v5, en Vercel | — |
| Backend hosting | Railway (mismo contenedor Docker migrable a AWS/K8s después) | Ver [07-infraestructura.md](docs/architecture/07-infraestructura.md) |
| Archivos | MinIO en local / Cloudflare R2 en producción | — |

## Estructura del repositorio

```
Stoka LMS/
├── docs/                         # Documentación (arquitectura + guía no técnica)
├── docker-compose.yml            # Entorno local: Postgres, Redis, MinIO, Keycloak
├── .env.example                  # Plantilla de variables de entorno (copiar a .env)
├── package.json / turbo.json     # Monorepo (npm workspaces + Turborepo)
├── scripts/
│   └── setup-keycloak.js         # Crea el realm/cliente/usuario de prueba en Keycloak
└── apps/
    └── api/                      # Backend NestJS (Core API)
        ├── prisma/
        │   ├── schema.prisma     # Modelo de datos completo
        │   ├── rls-policies.sql  # Políticas de aislamiento multi-tenant
        │   ├── apply-rls.js      # Script que aplica rls-policies.sql
        │   └── seed.js           # Roles/permisos base + tenant de desarrollo
        └── src/
            ├── main.ts           # Arranque del servidor
            ├── app.module.ts     # Módulo raíz (arma toda la app)
            ├── config/           # Lectura de variables de entorno
            ├── prisma/           # Conexión a base de datos (PrismaService)
            ├── common/tenant/    # Resolución del tenant activo por request
            ├── auth/             # Login (Keycloak) + aprovisionamiento JIT
            ├── rbac/             # Motor de permisos (Casbin) + guard
            ├── common/filters/   # Traduce errores de Prisma a respuestas HTTP claras
            ├── common/storage/   # Cliente de archivos (MinIO/S3), usado por Certificados
            └── modules/
                ├── health/       # Endpoint de salud
                ├── academic/     # Periodos, Cursos, Secciones
                ├── content/      # Módulos, Lecciones y Recursos (video/PDF/SCORM/enlaces) de un curso
                ├── enrollment/   # Matrícula individual y masiva (CSV)
                ├── gradebook/    # Escalas, categorías, evaluaciones, entregas, notas
                ├── certificates/ # Plantillas, emisión, revocación y verificación pública
                ├── tenant-registration/ # Alta de instituciones nuevas (solicitud pública + aprobación)
                ├── tenant/       # Nombre y marca (logo, fondo) del tenant activo
                └── user-management/ # Panel de administración: asignar/quitar roles a usuarios del tenant
            └── auth/
                ├── jwt.strategy.ts          # Valida el token + resuelve el usuario DENTRO de un tenant
                └── platform-jwt.strategy.ts # Valida el token SIN exigir un tenant (admin de plataforma)
    └── web/                      # Frontend Next.js
        ├── auth.ts               # Configuración de NextAuth.js (proveedor Keycloak)
        ├── lib/api.ts            # Único punto por el que el frontend llama al backend
        ├── components/           # Piezas de UI compartidas (ej. ErrorBanner)
        └── app/
            ├── page.tsx          # Inicio (login/logout)
            ├── dashboard/        # Página de diagnóstico: llama a /auth/me del backend
            ├── (app)/            # Pantallas de negocio, todas con el mismo layout+nav
            │   ├── layout.tsx           # Barra de navegación + comprobación de sesión
            │   ├── cursos/              # Lista y detalle de cursos/secciones
            │   │   └── [courseId]/
            │   │       ├── modulos/            # Contenido del curso: módulos, lecciones, subir/ver recursos
            │   │       ├── evaluaciones/       # Crear preguntas, rendir examen, calificar entregas abiertas
            │   │       └── secciones/[id]/     # Matricular (individual o CSV masivo), cambiar estado
            │   ├── mis-matriculas/      # Autoservicio: "en qué cursos estoy matriculado"
            │   ├── matriculas/[id]/certificados/  # Certificados de una matrícula
            │   ├── plantillas-certificado/        # Catálogo de plantillas (+ detalle/editar)
            │   ├── configuracion-marca/           # Nombre, logo y fondo de la institución
            │   └── usuarios/                      # Asignar/quitar roles a usuarios del tenant
            ├── registro-institucion/  # Formulario PÚBLICO de alta de una institución nueva
            ├── admin-plataforma/solicitudes/  # Aprobar/rechazar altas (admin de PLATAFORMA)
            ├── verify/[code]/    # Verificación PÚBLICA de un certificado (sin login)
            └── api/auth/[...nextauth]/route.ts  # Rutas de NextAuth.js
```

## Cómo levantar el entorno de desarrollo

Requiere: **Node.js 20+** (ya instalado), **Docker Desktop** (para Postgres/Redis/MinIO/Keycloak locales).

```bash
# 1. Instalar dependencias de todo el monorepo
npm install

# 2. Copiar la plantilla de variables de entorno (Prisma y NestJS la leen
#    desde la carpeta de cada app, no desde la raiz, por eso se copia dos veces)
cp .env.example .env
cp .env.example apps/api/.env

# 3. Levantar los servicios de infraestructura local
npm run docker:up

# 4. Crear las tablas en la base de datos a partir de prisma/schema.prisma
cd apps/api
npm run prisma:migrate

# 5. Activar el aislamiento multi-tenant (Row-Level Security).
#    Esto tambien crea un rol de base de datos restringido ("stoka_app")
#    que es el que usa el backend en tiempo real: en PostgreSQL, el usuario
#    administrador (el de DATABASE_URL) es superusuario y SIEMPRE se salta
#    Row-Level Security, sin importar como esten configuradas las politicas.
#    Ver la explicacion completa en apps/api/prisma/rls-policies.sql.
npm run prisma:rls

# 6. Sembrar roles/permisos base del sistema y un tenant de desarrollo
#    ("Instituto San Martín (desarrollo)", con dominios "localhost" y
#    "sanmartin.localhost" ya registrados para poder probar sin configurar nada mas)
npm run prisma:seed

# 7. Configurar Keycloak: crea el realm "stoka-dev", el cliente del backend
#    ("stoka-api"), el cliente del frontend ("stoka-web") y un usuario de
#    prueba. Requiere Keycloak arriba (paso 3). Al terminar imprime DOS
#    secretos: el del backend va en KEYCLOAK_CLIENT_SECRET (.env y
#    apps/api/.env), el del frontend va en AUTH_KEYCLOAK_SECRET
#    (apps/web/.env.local, ver apps/web/.env.example).
cd ..
npm run keycloak:setup

# 8. Arrancar el backend en modo desarrollo (recarga en caliente)
cd apps/api
npm run dev

# 9. En OTRA terminal: arrancar el frontend
cd apps/web
npm run dev
```

El frontend queda en `http://localhost:3000`: el botón "Iniciar sesión" redirige a Keycloak, y al volver muestra `/dashboard`, que llama a `GET /api/v1/auth/me` del backend con el token real de la sesión.

Usuarios de prueba que crea `npm run keycloak:setup` (ver `scripts/setup-keycloak.js`):

| Usuario | Contraseña | Uso pensado |
|---|---|---|
| `maria@stoka-lms.test` | `Maria12345!` | Login básico / rol Estudiante de fábrica |
| `carlos.estudiante@stoka-lms.test` | `Carlos12345!` | Estudiante "puro", para probar flujos donde el docente y el estudiante no pueden ser la misma persona (ej. rendir un examen) |

Ningún usuario tiene rol asignado al crearse — hay que asignarlo manualmente en `user_roles` (ver ejemplos en el historial de commits) hasta que exista un panel de administración.

Verificación rápida de que quedó bien:
```bash
curl http://localhost:3001/api/v1/health
# {"status":"ok",...}

# Login real contra Keycloak con el usuario de prueba que crea el paso 7:
curl -X POST http://localhost:8080/realms/stoka-dev/protocol/openid-connect/token \
  -d grant_type=password -d client_id=stoka-api -d "client_secret=<el que imprimio el paso 7>" \
  -d username=maria@stoka-lms.test -d password=Maria12345!
# devuelve un access_token

curl -H "Authorization: Bearer <access_token>" -H "Host: sanmartin.localhost" \
  http://localhost:3001/api/v1/auth/me
# {"userId":"...","tenantId":"...","email":"maria@stoka-lms.test",...}
```

## Cómo probar la interfaz en el navegador

Con el backend (`apps/api`, paso 8) y el frontend (`apps/web`, paso 9) corriendo:

1. Abrí `http://localhost:3000` en el navegador.
2. Clic en "Iniciar sesión" → te redirige a la pantalla de login de Keycloak.
3. Entrá con `maria@stoka-lms.test` / `Maria12345!` (rol de personal — coordinadora/docente/admin, ver
   la tabla de usuarios de prueba más abajo) o con `carlos.estudiante@stoka-lms.test` / `Carlos12345!`
   (estudiante "puro").
4. Te trae de vuelta a la plataforma, con esta navegación disponible:
   - **Cursos** — lista de cursos → entrás a una sección para ver quién está matriculado, cambiar su
     estado o matricular a alguien nuevo (necesita permiso de personal; un estudiante ve un mensaje de
     "no tienes permiso", es lo esperado).
   - **Mis matrículas** — en qué cursos/secciones estoy matriculado yo mismo, con acceso directo a mis
     notas y mis certificados (pensada para un Estudiante).
   - **Plantillas de certificado** — catálogo de plantillas HTML (personal).
   - Desde una matrícula: **Certificados** (emitir/revocar si sos personal, o solo ver los propios si
     sos estudiante) y, desde ahí, el enlace a la **página pública de verificación**
     (`/verify/:codigo`, sin necesidad de iniciar sesión — es la misma página a la que llegaría
     cualquiera al escanear el QR de un certificado impreso).

Si una pantalla muestra un mensaje de error en vez de datos, casi siempre es el rol actual sin el
permiso necesario (ver `docs/architecture/03-rbac.md`) — no un bug. Ningún usuario de prueba tiene rol
asignado al crearse (ver más abajo), así que hay que asignarlo a mano en `user_roles` para ver las
pantallas de personal funcionando.

## Alta de instituciones nuevas y marca

Una institución NUEVA no crea su cuenta a sí misma de forma instantánea (se decidió así a propósito:
sin billing todavía, no hay urgencia, y una revisión manual evita altas fraudulentas o duplicadas):

1. Cualquiera completa el formulario público en `/registro-institucion` (nombre, subdominio deseado,
   contacto) → crea una fila en `tenant_registration_requests` con estado `pending`.
2. Alguien con permiso de **administrador de PLATAFORMA** (ver más abajo — es un concepto DISTINTO de
   "Administrador de entidad", que es dentro de un tenant ya existente) entra a
   `/admin-plataforma/solicitudes` y la aprueba o rechaza.
3. Al aprobar (`tenant-registration.service.ts`): se crea el `Tenant`, su `TenantDomain`
   (`<subdominio>.<PLATFORM_ROOT_DOMAIN>`), y a la persona de contacto se le crea su cuenta con el rol
   "Administrador de entidad" — con permisos vigentes DE INMEDIATO (`CasbinService.reload()`), sin
   esperar a que nadie reinicie el backend.

**Quién puede aprobar — `PLATFORM_ADMIN_EMAILS`**: no es un rol más de RBAC por tenant (por definición,
aprueba instituciones que TODAVÍA NO EXISTEN, así que no hay tenant en el que asignarle ese rol) — es
una lista fija de emails en `.env` (ver `platform-jwt.strategy.ts` y `platform-admin.guard.ts`). Para
probarlo en desarrollo, `maria@stoka-lms.test` ya está en esa lista.

**Marca de cada institución**: un Administrador de entidad (permiso `tenant:edit`) entra a
`/configuracion-marca` y define el nombre, el logo y el color/imagen de fondo de SU institución — se
guardan en `Tenant.branding` (JSON) y son lo que ve cualquiera en el "home" público (`/`) de su
subdominio, ANTES de iniciar sesión.

**Limitación conocida (no resuelta todavía)**: aprobar una solicitud crea la cuenta de la institución
en la base de datos de Stoka LMS, pero NO crea todavía su usuario en Keycloak (el proveedor de login)
— hoy eso se sigue haciendo a mano, con `scripts/setup-keycloak.js` como referencia, hasta que se
integre la API de administración de Keycloak a este flujo.

**Cómo probarlo localmente sin editar tu archivo de hosts**: la resolución de tenant depende del
header `Host`, que en desarrollo siempre es `localhost` sin importar qué institución "creas" que estás
visitando. Para ver la marca de una institución recién aprobada, hacé el pedido con un header
`Host` distinto:
```bash
curl -H "Host: <subdominio>.stokalms.local:3000" http://localhost:3000/
```

## Endpoints de negocio disponibles

Todos protegidos con `JwtAuthGuard` + `PermissionsGuard` (ver `docs/architecture/03-rbac.md`):

| Recurso | Endpoints |
|---|---|
| Periodos académicos | `POST/GET /terms`, `GET/PATCH/DELETE /terms/:id` |
| Cursos | `POST/GET /courses`, `GET/PATCH/DELETE /courses/:id` |
| Secciones | `POST/GET /courses/:courseId/sections`, `GET/PATCH/DELETE /courses/:courseId/sections/:id` |
| Matrícula | `POST/GET /courses/:courseId/sections/:sectionId/enrollments`, `PATCH .../enrollments/:id` (cambia estado: active/dropped/completed), `POST .../enrollments/bulk` (matrícula masiva: una fila por estudiante, cada una en su propia transacción para que un error no arrastre a las demás) |
| Mis matrículas | `GET /enrollments/mine` — sin permiso administrativo, siempre acotado a las matrículas de quien pregunta (ver `my-enrollments.controller.ts`) |
| Contenido del curso | `POST/GET /courses/:courseId/modules`, `GET/PATCH/DELETE .../modules/:id`; `POST/GET .../modules/:moduleId/lessons`, `GET/PATCH/DELETE .../lessons/:id`; `POST .../lessons/:lessonId/resources` (sube un archivo real a MinIO/S3), `POST .../resources/link` (recurso externo, ej. clase en vivo), `GET .../resources` (incluye `downloadUrl` firmado), `GET .../resources/:id/download`, `DELETE .../resources/:id` |
| Escalas de notas | `POST/GET /grading-scales`, `GET/PATCH/DELETE /grading-scales/:id` |
| Categorías de calificación | `POST/GET /courses/:courseId/gradebook-categories`, `GET/PATCH/DELETE .../gradebook-categories/:id` |
| Evaluaciones | `POST/GET /courses/:courseId/assessments`, `GET/PATCH/DELETE .../assessments/:id` |
| Preguntas | `POST/GET /courses/:courseId/assessments/:assessmentId/questions`, `PATCH/DELETE .../questions/:id` (oculta `correctAnswer` a quien no tenga `assessment:edit`) |
| Entregas | `POST/GET .../assessments/:assessmentId/submissions` (auto-califica mcq/tf/matching), `PATCH .../submissions/:id/answers/:questionId` (calificación manual de preguntas abiertas) |
| Notas finales | `POST /courses/:courseId/gradebook/publish` (calcula y publica), `GET /courses/:courseId/grades` (vista completa o solo propia, según permisos) |
| Plantillas de certificado | `POST/GET /certificate-templates`, `GET/PATCH/DELETE /certificate-templates/:id` (recurso de tenant, no de curso) |
| Certificados | `POST /enrollments/:enrollmentId/certificates` (emite; exige matrícula en estado `completed`), `GET /enrollments/:enrollmentId/certificates`, `GET /certificates/:id` (vista completa o solo propia), `PATCH /certificates/:id/revoke` (nunca se borra) |
| Verificación pública | `GET /verify/:codigo` — **sin autenticación**, sin tenant conocido de antemano (ver la nota extensa en `rls-policies.sql` sobre `find_certificate_tenant`); devuelve solo nombre, curso, institución, fecha y si está vigente |
| Alta de instituciones | `POST /tenant-registration-requests` (**sin autenticación**), `GET /tenant-registration-requests`, `PATCH .../:id/approve`, `PATCH .../:id/reject` (estas tres requieren `PlatformAdminGuard`, no `PermissionsGuard` — ver más arriba) |
| Tenant activo | `GET /tenant/public` (**sin autenticación**, devuelve `null` si no hay tenant resuelto por el Host), `GET /tenant` (`tenant:view`), `PATCH /tenant` (`tenant:edit`, nombre + marca) |
| Usuarios y roles | `GET /users` (miembros del tenant con sus roles), `GET /roles` (roles disponibles), `POST/DELETE /users/:userTenantId/roles` (asignar/quitar, con alcance opcional a un curso) — permiso `role:view`/`role:assign`, hoy solo Administrador de entidad y Super Admin |

Notas importantes encontradas al probar contra el sistema real (no solo revisando el código):
- El `onDelete: Cascade` por defecto de Prisma borraba en cascada cursos/secciones/matrículas/notas/certificados al borrar su registro padre, sin avisar. Se cambió a `onDelete: Restrict` en toda la cadena académica (ver los comentarios en `schema.prisma`, empezando por el modelo `Course`), y se agregó un filtro global (`common/filters/prisma-exception.filter.ts`) que traduce ese error a un `409 Conflict` claro en vez de un `500` genérico.
- El `ValidationPipe` global (`forbidNonWhitelisted: true`) rechazaba el campo `answer` de una entrega porque no tenía ningún decorador de `class-validator` — cualquier campo de un DTO que acepte JSON libre necesita al menos `@IsDefined()` para no ser tratado como "no permitido" (ver `submit-assessment.dto.ts`).
- La nota final de un curso (ponderada por categorías, con `dropLowest`) **no se guarda** en su propia tabla: se recalcula cada vez a partir de las notas individuales por evaluación, para evitar dos fuentes de verdad desincronizadas (ver `gradebook.service.ts`).
- La verificación pública de un certificado no conoce el tenant de antemano (solo el código, que puede llegar de un QR impreso desde cualquier dominio). Se resolvió con una función SQL `SECURITY DEFINER` (`find_certificate_tenant`, ver `rls-policies.sql`) que hace un bypass de Row-Level Security ACOTADO al mínimo indispensable (solo el `tenant_id`, nunca el certificado en sí); con ese dato, el resto de la consulta pasa por el carril normal de `withTenant` con RLS aplicada.
- **Bug real encontrado probando con dos usuarios distintos**: `prisma/seed.js` solo AGREGABA permisos a los roles del sistema, nunca quitaba los que se retiraban de la lista. Al angostar el permiso de Estudiante de `certificate:view` (ver cualquier certificado del tenant) a `certificate:view_own` (solo el propio), la fila vieja de `view` seguía viva en la base de datos — un estudiante de prueba podía ver certificados ajenos conociendo el UUID de la matrícula. Se corrigió haciendo que el seed sea declarativo: al final de sembrar cada rol, borra cualquier `RolePermission` que ya no esté en la lista actual (ver el comentario extenso en `seed.js`).
- **Bug de entorno real (Windows + Docker Desktop + WSL2)**: el backend fallaba al arrancar con `PrismaClientInitializationError: Can't reach database server at localhost:5432`, a pesar de que Postgres estaba sano (`pg_isready` y `Test-NetConnection` de Windows daban bien). La causa: Node a veces resuelve `localhost` a la dirección IPv6 `::1`, cuyo reenvío de puerto por WSL2 puede quedar en un estado roto sin que el resto del sistema lo note. Se corrigió usando `127.0.0.1` en vez de `localhost` en `DATABASE_URL`/`RUNTIME_DATABASE_URL` (ver `.env.example`), forzando IPv4 explícito.
- Cada pantalla del frontend (`apps/web/app/(app)/.../actions.ts`) usa Server Actions de Next.js para las mutaciones (matricular, emitir/revocar certificado, crear plantilla) — se probaron de punta a punta simulando el POST real que produce un formulario sin JavaScript (progressive enhancement), no solo revisando que la pantalla cargue datos.
- **El frontend y el backend son dos servicios separados** — cuando el frontend llama a la API, lo hace hacia una URL fija (`STOKA_API_URL`), así que el header `Host` que ve el backend SIEMPRE reflejaba ese destino fijo, nunca el subdominio real que el navegador de la persona estaba visitando. Sin esto, TODAS las instituciones habrían visto siempre la marca del tenant de desarrollo. Se corrigió reenviando el Host original (leído con `headers()` de `next/headers`) en un header aparte, `X-Tenant-Host`, que `tenant-context.middleware.ts` prioriza sobre su propio `Host` (ver la nota extensa ahí y en `apps/web/lib/api.ts`).
- La aprobación de una institución necesita a alguien que NO es "de" ningún tenant (por definición, la institución todavía no existe) — el modelo de permisos por tenant (Casbin + dominios `tenant:<id>`) no tiene forma de expresar eso. Se resolvió con una segunda estrategia JWT (`platform-jwt.strategy.ts`) que valida el mismo token de Keycloak pero SIN pasar por el aprovisionamiento que exige un tenant resuelto, más una lista fija de emails autorizados (`PLATFORM_ADMIN_EMAILS`) — una simplificación deliberada del MVP, documentada en el propio guard.
- El modelo `Assessment` no tiene un campo de título propio (solo tipo, categoría, puntaje) — la pantalla de Evaluaciones usa el JSON libre `config.title` como convención de UI en vez de migrar el esquema para algo puramente cosmético.
- **Matrícula masiva**: se probó a propósito que un archivo con una fila de email inválido y otra ya matriculada NO bloquee las filas válidas del mismo lote — cada fila corre en su propia transacción (`enrollment.service.ts`, `bulkCreate`) y el formato del email se valida a mano ahí mismo, no con `@IsEmail()` en el DTO (esa validación es global y habría rechazado el request ENTERO por una sola fila con typo).
- **Subida de archivos como recurso de lección**: sube el archivo entero a memoria antes de reenviarlo a MinIO/S3 (mismo tipo de simplificación de MVP que la generación síncrona de certificados) — `STORAGE_MAX_UPLOAD_MB` (ver `.env.example`) pone un techo mientras no haga falta pasar a streaming/subida directa desde el navegador.
- Un examen con preguntas de opción múltiple/emparejamiento se auto-califica comparando la respuesta contra `correctAnswer` **por posición** dentro de un array, no como conjunto (`gradebook.util.ts`, `deepEqual`) — tanto la pantalla de crear preguntas como la de rendir el examen arman los ids de opciones siempre en el mismo orden de aparición para que ese detalle nunca cause una calificación incorrecta por simple cambio de orden.

## Qué sigue

Este es el cimiento del proyecto: estructura, entorno local, modelo de datos, aislamiento multi-tenant, **autenticación real contra Keycloak** (backend y frontend), **motor de permisos (Casbin)**, los módulos de **Académico, Contenido de curso, Matrícula (individual y masiva), Evaluaciones/Gradebook y Certificados**, **alta de instituciones nuevas + personalización de marca**, un **panel de administración de roles**, y un **frontend Next.js con pantallas de negocio reales** para todo lo anterior — todo validado de punta a punta con datos reales, incluida la subida de archivos. Los próximos pasos, en orden:

1. Integrar la API de administración de Keycloak al aprobar una institución — hoy el Administrador de entidad recién creado existe en la base de datos de Stoka LMS pero todavía necesita que alguien le cree su usuario en Keycloak a mano (ver la limitación conocida más arriba).
2. Cola de generación de certificados (BullMQ + worker separado) — hoy la emisión es SÍNCRONA dentro del request (ver la nota de simplificación del MVP en `certificate-renderer.service.ts`); pasar a una cola es trabajo de infraestructura genuino que se justifica cuando el volumen de emisiones lo requiera.
3. Clases en vivo integradas (hoy se resuelve con un recurso de tipo "link" a Zoom/Meet/YouTube, ver `content` módulo) y notificaciones por email (nueva calificación, certificado emitido).
4. Facturación/planes por institución — hoy `Tenant.plan` existe en el modelo pero no hay ningún flujo de cobro; necesario antes de operar con instituciones reales pagando.
5. Reportes/analítica para la institución (avance, finalización, uso) y SCORM/LTI para interoperar con contenido ya existente en otras plataformas.

Manuales de uso por rol, primeros pasos y resolución de problemas para personas no técnicas: ver [docs/manuales/](docs/manuales/README.md) (cubren exactamente lo que ya existe en pantalla; se amplían a medida que se agreguen las pantallas de la lista de arriba).

Ver el detalle completo de fases en [docs/architecture/06-roadmap.md](docs/architecture/06-roadmap.md).
