# Stoka LMS

Plataforma SaaS multi-tenant de gestión de aprendizaje (LMS) para entidades educativas — institutos, universidades, centros de capacitación y academias.

## Documentación

- [`docs/architecture/`](docs/architecture/README.md) — arquitectura técnica completa (stack, modelo de datos, RBAC, flujos, API, roadmap, infraestructura) con sus [ADRs](docs/architecture/adr/).
- [`docs/guia-para-no-tecnicos.md`](docs/guia-para-no-tecnicos.md) — la misma información explicada sin jerga técnica, con ejemplos.
- [`docs/manuales/`](docs/manuales/README.md) — manuales de USO para personas no técnicas: primeros pasos, uno por rol (Estudiante / Docente-Coordinador-Administrador) y resolución de problemas.
- [`docs/deploy/produccion.md`](docs/deploy/produccion.md) — cómo poner esto en producción de verdad (gratis, en una VM de Oracle Cloud), paso a paso.
- [`docs/funcionalidades-pendientes-pro-enterprise.md`](docs/funcionalidades-pendientes-pro-enterprise.md) — las 6 características de los planes Pro/Enterprise que la página de precios ya NO anuncia (API de integración, integraciones externas, SSO, API completa, integraciones empresariales/personalizadas): por qué se descartaron por ahora y qué haría falta para construirlas.

Todo el código de este repositorio implementa las decisiones documentadas ahí — si algo en el código no coincide con esos documentos, uno de los dos está desactualizado y hay que corregirlo.

## Stack elegido para iniciar

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
            ├── main.ts           # Inicio del servidor
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
                ├── content/      # Módulos, Lecciones y Recursos (PDF/Word/Excel/PowerPoint/imágenes/video/SCORM/enlaces) de un curso
                ├── enrollment/   # Matrícula individual y masiva (CSV); roster con certificado vigente; sustento (archivo) al cambiar de estado
                ├── gradebook/    # Escalas, categorías, evaluaciones, entregas, notas (computeCourseGrades ahora público, reusado por academic-progress)
                ├── certificates/ # Plantillas, emisión (usa la plantilla FIJA del curso), revocación y verificación pública
                ├── attendance/   # Asistencia por sección (marcar/corregir por fecha, un registro por alumno y día)
                ├── student-notes/ # Anotaciones de desempeño por alumno (texto libre, no califica nada)
                ├── academic-progress/ # "Avance" de un alumno: lecciones vistas, evaluaciones rendidas, asistencia, nota parcial
                ├── tenant-registration/ # Alta de instituciones nuevas (solicitud pública + aprobación)
                ├── tenant/       # Nombre y marca (logo, fondo) del tenant activo
                ├── user-management/ # Asignar/quitar roles + editar el perfil de OTRA persona (contacto/residencia)
                └── profile/      # "Mi perfil": datos personales (solo lectura) + subir la foto
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
            │   ├── periodos/            # Crear/ver Periodos académicos (Term) — primer paso antes de crear un curso
            │   ├── cursos/              # Lista (+ "Crear curso") y detalle de cursos/secciones
            │   │   ├── nuevo/                   # Crear un Curso (elige Periodo, escala de notas y plantilla de certificado, todo opcional salvo el Periodo)
            │   │   └── [courseId]/
            │   │       ├── modulos/            # Contenido del curso: módulos, lecciones, recursos — crear Y editar
            │   │       ├── notas/              # Notas finales del curso, con columna de Sección + filtro por sección
            │   │       ├── evaluaciones/       # Crear preguntas, rendir examen, calificar entregas abiertas
            │   │       └── secciones/
            │   │           ├── nueva/                  # Crear una Sección dentro del curso
            │   │           └── [id]/                   # Roster (estado, certificado, avance, anotaciones, editar perfil); matricular/CSV/cambiar estado según permiso
            │   │               ├── asistencia/          # Tomar/corregir asistencia de la sección para una fecha
            │   │               └── enrollments/[id]/sustentos/  # Archivos de respaldo (ej. carta de retiro) de una matrícula
            │   ├── notas/                          # "Notas" como sección propia, con filtro por Periodo académico (año)
            │   ├── mis-matriculas/      # Autoservicio: "en qué cursos estoy matriculado" (oculto del menú para roles de personal)
            │   ├── mis-certificados/              # Certificados propios, agrupados por curso (oculto del menú para roles de personal)
            │   ├── matriculas/[id]/certificados/  # Certificados de una matrícula (ver siempre; emitir/revocar según permiso)
            │   ├── matriculas/[id]/notas/          # Anotaciones de desempeño de esa matrícula
            │   ├── matriculas/[id]/avance/          # "Avance": lecciones vistas, evaluaciones rendidas, asistencia, nota parcial
            │   ├── plantillas-certificado/        # Catálogo de plantillas (+ detalle/editar)
            │   ├── configuracion-marca/           # Nombre, logo y fondo de la institución
            │   ├── usuarios/                      # Asignar/quitar roles a usuarios del tenant
            │   │   └── [userTenantId]/perfil/      # Editar el perfil de OTRA persona (contacto/residencia) — no el propio
            │   └── perfil/                        # Datos personales (solo lectura) + subir la foto
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
#    ("Instituto San Martín (desarrollo)", con el dominio "sanmartin.localhost"
#    ya registrado para poder probar sin configurar nada mas -- los
#    navegadores modernos resuelven cualquier "*.localhost" solos, sin tocar
#    el archivo de hosts). El dominio RAIZ ("localhost:3000", sin
#    subdominio) queda libre a proposito para la landing de LA PLATAFORMA
#    (ver PlatformLanding.tsx) -- misma topologia que produccion.
npm run prisma:seed

# 7. Configurar Keycloak: crea el realm "stoka-dev", el cliente del backend
#    ("stoka-api"), el cliente del frontend ("stoka-web") y un usuario de
#    prueba. Requiere Keycloak arriba (paso 3). Al terminar imprime DOS
#    secretos: el del backend va en KEYCLOAK_CLIENT_SECRET (.env y
#    apps/api/.env), el del frontend va en AUTH_KEYCLOAK_SECRET
#    (apps/web/.env.local, ver apps/web/.env.example).
cd ..
npm run keycloak:setup

# 8. Iniciar el backend en modo desarrollo (recarga en caliente)
cd apps/api
npm run dev

# 9. En OTRA terminal: iniciar el frontend
cd apps/web
npm run dev
```

El frontend queda en `http://localhost:3000` — esa es la landing de LA PLATAFORMA (`PlatformLanding.tsx`),
no la de ninguna institución en particular:

- **"Iniciar sesión"** (para una institución ya registrada) lleva a `/entrar`, donde se escribe el
  nombre de la institución (ej. `sanmartin`, el tenant de desarrollo) — de ahí, un enlace real lleva a
  `http://sanmartin.localhost:3000`, el subdominio propio de esa institución, que es recién ahí donde
  el botón "Iniciar sesión" redirige a Keycloak de verdad (el login siempre pasa por el dominio de la
  institución, nunca por el dominio raíz — ver la nota grande en `app/entrar/page.tsx`).
- **"Acceso de administración"** (al pie de la página) es para el equipo de Stoka, no para una
  institución — inicia sesión directo ahí mismo en el dominio raíz y aterriza en
  `/admin-plataforma/solicitudes` (ver `maria@stoka-lms.test` en la tabla de abajo, ya configurada en
  `PLATFORM_ADMIN_EMAILS`).

Usuarios de prueba que crea `npm run keycloak:setup` (ver `scripts/setup-keycloak.js`) — uno por cada
rol base del sistema, cada uno con **un solo rol asignado** (para poder probar cada rol aislado, sin la
confusión de una cuenta con varios roles a la vez encima):

| Usuario | Contraseña | Rol asignado |
|---|---|---|
| `superadmin@stoka-lms.test` | `SuperAdmin12345!` | Super Admin |
| `maria@stoka-lms.test` | `Maria12345!` | Administrador de entidad |
| `coordinador@stoka-lms.test` | `Coordinador12345!` | Coordinador académico |
| `docente@stoka-lms.test` | `Docente12345!` | Docente |
| `carlos.estudiante@stoka-lms.test` | `Carlos12345!` | Estudiante |
| `padre@stoka-lms.test` | `Padre12345!` | Padre/Apoderado |
| `auditor@stoka-lms.test` | `Auditor12345!` | Auditor/Invitado |

`maria@stoka-lms.test` está además en `PLATFORM_ADMIN_EMAILS`, así que también puede aprobar/rechazar
altas de instituciones en `/admin-plataforma/solicitudes` — eso es independiente de su rol de tenant.

Este script SOLO crea las cuentas en Keycloak (login) — el rol de cada una se asigna, una única vez,
desde el panel **"Usuarios y roles"** (`/usuarios`, necesita que la cuenta ya haya iniciado sesión al
menos una vez) o vía `POST /users/:userTenantId/roles`. Si vuelves a sembrar la base de datos desde cero
(`npm run prisma:seed` en una base nueva), las cuentas de Keycloak siguen existiendo pero hay que
volver a asignarles su rol.

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

1. Abrí `http://localhost:3000` en el navegador — es la landing de la plataforma.
2. Clic en "Iniciar sesión" → `/entrar` → escribe `sanmartin` (el tenant de desarrollo) → clic en
   "Continuar" → te lleva a `http://sanmartin.localhost:3000`, la página de esa institución.
3. Ahí sí, clic en "Iniciar sesión" → te redirige a la pantalla de login de Keycloak.
4. Entra con `maria@stoka-lms.test` / `Maria12345!` (Administrador de entidad: ve todas las pantallas)
   o con cualquiera de los otros usuarios de prueba (ver la tabla más abajo) para probar un rol
   específico de forma aislada.
5. Te trae de vuelta a la plataforma, con esta navegación disponible:
   - **Cursos** — lista de cursos → entras a una sección para ver quién está matriculado, cambiar su
     estado o matricular a alguien nuevo (necesita permiso de personal; un estudiante ve un mensaje de
     "no tienes permiso", es lo esperado).
   - **Mis matrículas** — en qué cursos/secciones estoy matriculado yo mismo, con acceso directo a mis
     notas y mis certificados (pensada para un Estudiante).
   - **Plantillas de certificado** — catálogo de plantillas HTML (personal).
   - Desde una matrícula: **Certificados** (emitir/revocar si eres personal, o solo ver los propios si
     eres estudiante) y, desde ahí, el enlace a la **página pública de verificación**
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
   contacto) → crea una fila en `tenant_registration_requests` con estado `pending`. **O**, si quien
   está creando la institución es directamente el equipo de la plataforma (sin depender de que alguien
   externo complete el formulario), un administrador de plataforma entra a
   `/admin-plataforma/instituciones/nueva` y la crea (y aprueba) de una — mismo resultado, sin el paso
   intermedio de "pendiente".
2. Alguien con permiso de **administrador de PLATAFORMA** (ver más abajo — es un concepto DISTINTO de
   "Administrador de entidad", que es dentro de un tenant ya existente) entra a
   `/admin-plataforma/solicitudes` y la aprueba o rechaza.
3. Al aprobar (`tenant-registration.service.ts`, método `provisionTenant` — el mismo motor para los dos
   caminos del punto 1): se crea el `Tenant`, su `TenantDomain` (`<subdominio>.<PLATFORM_ROOT_DOMAIN>`),
   la membresía de la persona de contacto con el rol "Administrador de entidad" — con permisos vigentes
   DE INMEDIATO (`CasbinService.reload()`), sin esperar a que nadie reinicie el backend — **y su cuenta
   de Keycloak**, con una contraseña temporal de un solo uso que se muestra en pantalla justo después
   (nunca en la URL, ver `admin-plataforma/temp-credentials.ts`) para pasarle a esa persona por un canal
   seguro; Keycloak la obliga a cambiarla en su primer inicio de sesión. Si ya existía una cuenta con ese
   email (Keycloak es un único realm compartido por toda la plataforma), no se crea una duplicada — el
   aviso en pantalla lo aclara.

**Quién puede aprobar — `PLATFORM_ADMIN_EMAILS`**: no es un rol más de RBAC por tenant (por definición,
aprueba instituciones que TODAVÍA NO EXISTEN, así que no hay tenant en el que asignarle ese rol) — es
una lista fija de emails en `.env` (ver `platform-jwt.strategy.ts` y `platform-admin.guard.ts`). Para
probarlo en desarrollo, `maria@stoka-lms.test` ya está en esa lista.

**Cómo se crea la cuenta de Keycloak sin guardar la contraseña del admin real en el backend**: el
cliente `stoka-api` (el mismo que ya usa este backend para todo lo demás) tiene su propia identidad de
"cuenta de servicio" (`grant_type=client_credentials`, mismo `KEYCLOAK_CLIENT_SECRET` de siempre — ningún
secreto nuevo que agregar a ningún `.env`), con el rol `manage-users` del cliente interno
`realm-management` de Keycloak — y SOLO ese rol (no administra clientes ni el realm entero). Lo
configura `scripts/setup-keycloak.js` (`ensureAdminServiceAccount`), corre siempre, así que un
`stoka-api` creado antes de que esto existiera lo recibe igual la próxima vez que se corra el script.

**Marca de cada institución**: un Administrador de entidad (permiso `tenant:edit`) entra a
`/configuracion-marca` y define el nombre, el color de fondo (respaldo) y **sube como archivo real**
el logo y la imagen de fondo de SU institución (`POST /tenant/logo`, `POST /tenant/background-image` —
mismo patrón de subida que la foto de perfil). Como el bucket de MinIO/S3 no es público, `Tenant.branding`
solo guarda las **keys** del archivo (`logoKey`/`backgroundImageKey`); `GET /tenant` y `GET /tenant/public`
las resuelven a una URL firmada FRESCA en cada respuesta (nunca se guarda una URL firmada directamente,
quedaría vencida a la hora) — así se ve en el "home" público (`/`) de su subdominio, ANTES de iniciar
sesión.

**El subdominio de cada institución nueva se registra solo en Keycloak — ya no hace falta ningún paso
manual**: el cliente OIDC `stoka-web` solo acepta volver a un `redirect_uri` que esté EXPLÍCITAMENTE en
su lista — Keycloak no admite comodines en la parte del host/subdominio de un redirect URI (es una
protección de seguridad real, no un descuido: permitirlo abriría la puerta a que un subdominio ajeno se
robe un código de autorización). Antes, esto dejaba la cuenta de la institución LISTA pero su login
FALLABA hasta que alguien con acceso al admin de Keycloak agregaba el redirect URI a mano. Ahora,
`provisionTenant` (`tenant-registration.service.ts`) llama a
`KeycloakAdminService.registerRedirectUri(domain)` ANTES de crear la cuenta de la persona de contacto:
arma el origen completo del subdominio a partir de `WEB_ORIGIN` (mismo protocolo/puerto que el resto de
la plataforma, solo cambia el host) y lo agrega a `redirectUris`/`webOrigins`/`post.logout.redirect.uris`
del cliente `stoka-web`. Esto necesitó darle al service account de `stoka-api` el rol `manage-clients`
además de `manage-users` (ver `ensureAdminServiceAccount` en `scripts/setup-keycloak.js`) — un salto de
privilegio real (puede reconfigurar cualquier cliente del realm, no solo agregarle un redirect_uri a
`stoka-web`), asumido a propósito en vez de seguir agregando cada institución nueva a mano. Si este paso
fallara igual (Keycloak caído, timeout), el tenant se crea igual — el aviso en pantalla (`keycloakWarning`
en la respuesta) explica qué hace falta arreglar a mano en ese caso puntual.

**Cómo probarlo localmente sin editar tu archivo de hosts**: `PLATFORM_ROOT_DOMAIN` en desarrollo es
`localhost` (ver `.env.example`), así que al aprobar una solicitud con subdominio deseado
`<subdominio>` queda registrado como `<subdominio>.localhost` — visitá
`http://<subdominio>.localhost:3000` directo en el navegador para ver su marca; los navegadores
modernos resuelven cualquier `*.localhost` a `127.0.0.1` solos (RFC 6761), sin tocar el archivo de
hosts ni nada más. Por curl, sin depender de esa resolución del navegador:
```bash
curl -H "Host: <subdominio>.localhost:3000" http://localhost:3000/
```

## Endpoints de negocio disponibles

Todos protegidos con `JwtAuthGuard` + `PermissionsGuard` (ver `docs/architecture/03-rbac.md`):

| Recurso | Endpoints |
|---|---|
| Periodos académicos | `POST/GET /terms`, `GET/PATCH/DELETE /terms/:id` |
| Cursos | `POST/GET /courses`, `GET/PATCH/DELETE /courses/:id` |
| Secciones | `POST/GET /courses/:courseId/sections`, `GET/PATCH/DELETE /courses/:courseId/sections/:id` |
| Matrícula | `POST/GET /courses/:courseId/sections/:sectionId/enrollments` (el listado ya incluye `hasCertificate` por alumno), `PATCH .../enrollments/:id` (cambia estado: active/dropped/completed), `POST .../enrollments/bulk` (matrícula masiva: una fila por estudiante, cada una en su propia transacción para que un error no arrastre a las demás) |
| Mis matrículas | `GET /enrollments/mine` — sin permiso administrativo, siempre acotado a las matrículas de quien pregunta (ver `my-enrollments.controller.ts`) |
| Contenido del curso | `POST/GET /courses/:courseId/modules`, `GET/PATCH/DELETE .../modules/:id`; `POST/GET .../modules/:moduleId/lessons`, `GET/PATCH/DELETE .../lessons/:id`; `POST .../lessons/:lessonId/resources` (sube un archivo real a MinIO/S3), `POST .../resources/link` (recurso externo, ej. clase en vivo), `GET .../resources` (incluye `downloadUrl` firmado), `GET .../resources/:id/download`, `PATCH .../resources/:id` (título/descripción, y URL si es tipo `link`), `DELETE .../resources/:id` |
| Asistencia | `GET /courses/:courseId/sections/:sectionId/attendance?date=YYYY-MM-DD` (roster de matrículas activas + su estado ese día), `POST .../attendance` (marca/corrige toda la sección de una vez, un registro por `enrollmentId`+fecha vía `upsert`, ver el `@@unique` en `schema.prisma`) |
| Anotaciones por alumno | `GET/POST /enrollments/:enrollmentId/notes`, `DELETE .../notes/:id` — texto libre de seguimiento (no nesteado bajo curso, igual que Certificados) |
| Sustento de matrícula | `GET/POST /courses/:courseId/sections/:sectionId/enrollments/:id/attachments` (archivo de respaldo, ej. carta de retiro; sube a MinIO/S3) |
| Avance de un alumno | `GET /enrollments/:enrollmentId/progress` — lecciones vistas, evaluaciones rendidas, asistencia y nota parcial (reusa `GradebookService.computeCourseGrades` sin publicar nada) |
| Vista de una lección | `POST /courses/:courseId/modules/:moduleId/lessons/:id/view` — registra la PRIMERA vez que ESE alumno (si lo es; no-op si no tiene matrícula activa en el curso) abre la lección, para "Avance" |
| Escalas de notas | `POST/GET /grading-scales`, `GET/PATCH/DELETE /grading-scales/:id` |
| Categorías de calificación | `POST/GET /courses/:courseId/gradebook-categories`, `GET/PATCH/DELETE .../gradebook-categories/:id` |
| Evaluaciones | `POST/GET /courses/:courseId/assessments` (acepta `moduleId` opcional, para anidarla dentro de un módulo), `GET/PATCH/DELETE .../assessments/:id` |
| Preguntas | `POST/GET /courses/:courseId/assessments/:assessmentId/questions`, `PATCH/DELETE .../questions/:id` (oculta `correctAnswer` a quien no tenga `assessment:edit`) |
| Entregas | `POST/GET .../assessments/:assessmentId/submissions` (auto-califica mcq/tf/matching), `PATCH .../submissions/:id/answers/:questionId` (calificación manual de preguntas abiertas) |
| Notas finales | `POST /courses/:courseId/gradebook/publish` (calcula y publica), `GET /courses/:courseId/grades` (vista completa o solo propia, según permisos) |
| Plantillas de certificado | `POST/GET /certificate-templates`, `GET/PATCH/DELETE /certificate-templates/:id` (catálogo de tenant; cada `Course` referencia UNA vía `certificateTemplateId`, ver más abajo) |
| Certificados | `POST /enrollments/:enrollmentId/certificates` (emite con la plantilla FIJA del curso — `templateId` en el body ahora es un override opcional, no obligatorio; exige matrícula en estado `completed` y curso con plantilla asignada), `GET /enrollments/:enrollmentId/certificates`, `GET /certificates/:id` (vista completa o solo propia), `PATCH /certificates/:id/revoke` (nunca se borra) |
| Verificación pública | `GET /verify/:codigo` — **sin autenticación**, sin tenant conocido de antemano (ver la nota extensa en `rls-policies.sql` sobre `find_certificate_tenant`); devuelve solo nombre, curso, institución, fecha y si está vigente |
| Alta de instituciones | `POST /tenant-registration-requests` (**sin autenticación**), `GET /tenant-registration-requests`, `PATCH .../:id/approve`, `PATCH .../:id/reject` (estas tres requieren `PlatformAdminGuard`, no `PermissionsGuard` — ver más arriba) |
| Tenant activo | `GET /tenant/public` (**sin autenticación**, devuelve `null` si no hay tenant resuelto por el Host; logo/fondo ya resueltos a URL firmada fresca), `GET /tenant` (`tenant:view`), `PATCH /tenant` (`tenant:edit`, nombre + color de fondo), `POST /tenant/logo`, `POST /tenant/background-image` (`tenant:edit`, suben un archivo real; guardan la key, nunca la URL) |
| Usuarios y roles | `GET /users` (miembros del tenant con sus roles), `GET /roles` (roles disponibles), `POST/DELETE /users/:userTenantId/roles` (asignar/quitar, con alcance opcional a un curso) — permiso `role:view`/`role:assign`, hoy solo Administrador de entidad y Super Admin |
| Editar perfil de otra persona (o el propio) | `GET/PATCH /users/:userTenantId/profile` (contacto/residencia) — permiso `user_profile:edit` (Coordinador académico, Administrador); el frontend (`/perfil`) lo reusa apuntado a la PROPIA membresía cuando quien mira ya tiene ese permiso, en vez de duplicar la lógica de edición |
| Permisos del usuario actual | `GET /auth/me` (incluye `permissions: string[]`, alcance tenant), `GET /auth/permissions?courseId=` (version acotada a un curso especifico) — el frontend los usa para OCULTAR botones/enlaces que el rol actual no puede usar, ver `lib/api.ts` |
| Mi perfil | `GET /profile` (datos personales + `enrolledAt` + `userTenantId`), `POST /profile/photo` (sube una imagen real a MinIO/S3) — sin permiso administrativo, acotado por construcción a quien hace el pedido. Editar el resto de los datos desde aquí requiere `user_profile:edit` (ver fila de arriba); sin ese permiso, siguen siendo de solo lectura |

Notas importantes encontradas al probar contra el sistema real (no solo revisando el código):
- El `onDelete: Cascade` por defecto de Prisma borraba en cascada cursos/secciones/matrículas/notas/certificados al borrar su registro padre, sin avisar. Se cambió a `onDelete: Restrict` en toda la cadena académica (ver los comentarios en `schema.prisma`, empezando por el modelo `Course`), y se agregó un filtro global (`common/filters/prisma-exception.filter.ts`) que traduce ese error a un `409 Conflict` claro en vez de un `500` genérico.
- El `ValidationPipe` global (`forbidNonWhitelisted: true`) rechazaba el campo `answer` de una entrega porque no tenía ningún decorador de `class-validator` — cualquier campo de un DTO que acepte JSON libre necesita al menos `@IsDefined()` para no ser tratado como "no permitido" (ver `submit-assessment.dto.ts`).
- La nota final de un curso (ponderada por categorías, con `dropLowest`) **no se guarda** en su propia tabla: se recalcula cada vez a partir de las notas individuales por evaluación, para evitar dos fuentes de verdad desincronizadas (ver `gradebook.service.ts`).
- La verificación pública de un certificado no conoce el tenant de antemano (solo el código, que puede llegar de un QR impreso desde cualquier dominio). Se resolvió con una función SQL `SECURITY DEFINER` (`find_certificate_tenant`, ver `rls-policies.sql`) que hace un bypass de Row-Level Security ACOTADO al mínimo indispensable (solo el `tenant_id`, nunca el certificado en sí); con ese dato, el resto de la consulta pasa por el carril normal de `withTenant` con RLS aplicada.
- **Bug real encontrado probando con dos usuarios distintos**: `prisma/seed.js` solo AGREGABA permisos a los roles del sistema, nunca quitaba los que se retiraban de la lista. Al angostar el permiso de Estudiante de `certificate:view` (ver cualquier certificado del tenant) a `certificate:view_own` (solo el propio), la fila vieja de `view` seguía viva en la base de datos — un estudiante de prueba podía ver certificados ajenos conociendo el UUID de la matrícula. Se corrigió haciendo que el seed sea declarativo: al final de sembrar cada rol, borra cualquier `RolePermission` que ya no esté en la lista actual (ver el comentario extenso en `seed.js`).
- **Bug de entorno real (Windows + Docker Desktop + WSL2)**: el backend fallaba al iniciar con `PrismaClientInitializationError: Can't reach database server at localhost:5432`, a pesar de que Postgres estaba sano (`pg_isready` y `Test-NetConnection` de Windows daban bien). La causa: Node a veces resuelve `localhost` a la dirección IPv6 `::1`, cuyo reenvío de puerto por WSL2 puede quedar en un estado roto sin que el resto del sistema lo note. Se corrigió usando `127.0.0.1` en vez de `localhost` en `DATABASE_URL`/`RUNTIME_DATABASE_URL` (ver `.env.example`), forzando IPv4 explícito.
- Cada pantalla del frontend (`apps/web/app/(app)/.../actions.ts`) usa Server Actions de Next.js para las mutaciones (matricular, emitir/revocar certificado, crear plantilla) — se probaron de punta a punta simulando el POST real que produce un formulario sin JavaScript (progressive enhancement), no solo revisando que la pantalla cargue datos.
- **El frontend y el backend son dos servicios separados** — cuando el frontend llama a la API, lo hace hacia una URL fija (`STOKA_API_URL`), así que el header `Host` que ve el backend SIEMPRE reflejaba ese destino fijo, nunca el subdominio real que el navegador de la persona estaba visitando. Sin esto, TODAS las instituciones habrían visto siempre la marca del tenant de desarrollo. Se corrigió reenviando el Host original (leído con `headers()` de `next/headers`) en un header aparte, `X-Tenant-Host`, que `tenant-context.middleware.ts` prioriza sobre su propio `Host` (ver la nota extensa ahí y en `apps/web/lib/api.ts`).
- La aprobación de una institución necesita a alguien que NO es "de" ningún tenant (por definición, la institución todavía no existe) — el modelo de permisos por tenant (Casbin + dominios `tenant:<id>`) no tiene forma de expresar eso. Se resolvió con una segunda estrategia JWT (`platform-jwt.strategy.ts`) que valida el mismo token de Keycloak pero SIN pasar por el aprovisionamiento que exige un tenant resuelto, más una lista fija de emails autorizados (`PLATFORM_ADMIN_EMAILS`) — una simplificación deliberada del MVP, documentada en el propio guard.
- El modelo `Assessment` no tiene un campo de título propio (solo tipo, categoría, puntaje) — la pantalla de Evaluaciones usa el JSON libre `config.title` como convención de UI en vez de migrar el esquema para algo puramente cosmético.
- **Matrícula masiva**: se probó a propósito que un archivo con una fila de email inválido y otra ya matriculada NO bloquee las filas válidas del mismo lote — cada fila corre en su propia transacción (`enrollment.service.ts`, `bulkCreate`) y el formato del email se valida a mano ahí mismo, no con `@IsEmail()` en el DTO (esa validación es global y habría rechazado el request ENTERO por una sola fila con typo).
- **Subida de archivos como recurso de lección**: sube el archivo entero a memoria antes de reenviarlo a MinIO/S3 (mismo tipo de simplificación de MVP que la generación síncrona de certificados) — `STORAGE_MAX_UPLOAD_MB` (ver `.env.example`) pone un techo mientras no haga falta pasar a streaming/subida directa desde el navegador.
- Un examen con preguntas de opción múltiple/emparejamiento se auto-califica comparando la respuesta contra `correctAnswer` **por posición** dentro de un array, no como conjunto (`gradebook.util.ts`, `deepEqual`) — tanto la pantalla de crear preguntas como la de rendir el examen arman los ids de opciones siempre en el mismo orden de aparición para que ese detalle nunca cause una calificación incorrecta por simple cambio de orden.
- **UI consciente del rol real, no solo el backend**: hasta ahora cada pantalla mostraba siempre sus botones de crear/eliminar y dejaba que el 403 del backend los bloqueara — funcional, pero confuso para una persona real (un Estudiante veía "Crear módulo" o "Configuración de marca" en el menú, ninguno de los cuales iba a funcionar). Se agregó `GET /auth/permissions` (`casbin.service.ts`, `getPermissions`) para que el frontend pueda preguntar "¿qué puede hacer este rol?" y ocultar controles inútiles — probado en vivo con los 7 usuarios de prueba (uno por rol), confirmando que cada uno ve exactamente lo que su rol permite.
- `firstName`/`lastName` (para "Mi perfil") se completan solos con los claims `given_name`/`family_name` que Keycloak ya incluye en el token — incluso para cuentas creadas ANTES de que estos campos existieran, se hizo un backfill en el primer login posterior a la migración (`auth.service.ts`, `findOrProvisionUser`), sin sobreescribir nunca un valor que ya estuviera cargado.
- **Permisos de Docente ajustados tras revisar el rol a fondo**: le faltaba `section:view` (sin eso no podía ni llegar a la pantalla de matriculados de una sección, un bug pre-existente nunca notado porque nadie había probado ese rol contra esa pantalla) y `enrollment:view` (para ver el roster, sin poder matricular/retirar); y se le QUITÓ `certificate:issue` (ve el estado del certificado de cada alumno, pero ya no lo emite — eso queda en Coordinador académico/Administrador). Ver la lista completa en `prisma/seed.js`.
- **Refresco automático de sesión (ya corregido)**: el token de acceso de Keycloak expira en minutos (`accessTokenLifespan` del realm, 300s en desarrollo); al no refrescarse, cualquier pantalla fallaba con el error genérico "Ocurrió un error inesperado" hasta volver a iniciar sesión — detectado probando manualmente con una sesión larga. Se corrigió en `apps/web/auth.ts` (callback `jwt`): guarda `refresh_token` + cuándo expira el `access_token` en el login, y lo renueva solo contra Keycloak (`grant_type=refresh_token`) antes de que expire; si el refresh mismo falla (ej. `refresh_token` vencido tras 30 min de inactividad, `ssoSessionIdleTimeout`), `requireAccessToken()` (`lib/api.ts`) manda derecho a iniciar sesión de nuevo en vez de mostrar el error genérico. Verificado con un intercambio OAuth2 manual e independiente de NextAuth: login real → `access_token`/`refresh_token` → refresh → nuevo `access_token` aceptado por el backend.
- **Bloqueo de sesión por inactividad (3 minutos)**: `components/IdleSessionGuard.tsx`, montado en `app/(app)/layout.tsx`, escucha actividad de mouse/teclado/touch en el navegador; sin ninguna en 3 minutos, tapa la pantalla y ofrece **reingresar con la contraseña** (`session-actions.ts`, `reingresarConContrasena` — usa `prompt=login` + `login_hint=<email>` contra Keycloak: fuerza a pedir la contraseña de nuevo aunque la cookie de SSO siga viva, pero precompleta el usuario) o **cerrar sesión del todo** (mismo logout RP-initiated del botón del header). Pensado para computadoras compartidas (ej. sala de profesores); es una capa de UX sobre la expiración real del token, no la reemplaza.
- **Asistencia**: un registro por matrícula y fecha de sesión (`@@unique([enrollmentId, sessionDate])` en `AttendanceRecord`) — volver a marcar el mismo día actualiza el registro existente (`upsert`) en vez de duplicarlo; solo se lista a matrículas con estado `active` (alguien retirado no aparece en la lista para tomar asistencia).
- **Anotaciones de desempeño**: modelo nuevo (`StudentNote`) sin relación con `Grade` — es texto libre de seguimiento cualitativo, no califica nada. Se probó de punta a punta como Docente real (login completo contra Keycloak vía curl, sin usar el navegador).
- **Coordinador académico auditado a fondo con el rol real**: probando en vivo se encontró que no existía NINGUNA pantalla para crear Periodo/Curso/Sección (el backend ya lo soportaba desde el principio, pero nadie podía usarlo salvo por API directa) — se agregaron las tres pantallas (`/periodos`, `/cursos/nuevo`, `/cursos/:id/secciones/nueva`). Aprovechando el mismo pedido, Coordinador ahora también puede crear/editar/borrar módulos, lecciones y recursos ("contingencia" para dar de alta un curso completo sin depender de que ya exista un Docente asignado) — antes solo tenía `module:view`/`lesson:view`, sin `resource` en absoluto.
- **Plantilla de certificado por curso**: `Course.certificateTemplateId` (nuevo, opcional) reemplaza la elección manual de plantilla en cada emisión — `IssueCertificateDto.templateId` pasó a ser un override opcional, no obligatorio. Emitir sin plantilla asignada al curso ahora falla con un mensaje claro señalando que hay que asignarle una desde el curso, en vez de un 400 genérico de "falta templateId".
- **Sustento (archivo) al retirar una matrícula**: nuevo modelo `EnrollmentAttachment` — el archivo se sube ANTES de cambiar el estado a `dropped` (si la subida falla, la matrícula no queda "retirada sin su respaldo"). Es opcional a propósito: no todo retiro necesita un documento.
- **"Avance" de un alumno**: combina cuatro fuentes que ya existían por separado (lecciones vistas — modelo nuevo `LessonView`, solo cuenta la PRIMERA apertura y únicamente si quien abre es alumno matriculado activo, no Docente/Coordinador editando contenido; evaluaciones rendidas — `Submission` distinct por `assessmentId`; asistencia acumulada — `AttendanceRecord`; nota parcial — se reutilizó `GradebookService.computeCourseGrades`, antes `private`, ahora público, exactamente porque YA funcionaba como "nota parcial" sin publicar nada, solo hacía falta exponerlo).
- **Edición de perfil por staff**: `PATCH /users/:userTenantId/profile` (permiso nuevo `user_profile:edit`) — cierra el hueco donde los campos de contacto/residencia de un `User` (teléfono, dirección, departamento/provincia/distrito) solo se podían completar a mano en la base de datos.
- **"Mis matrículas"/"Mis certificados" ocultos para roles de personal**: se mostraban siempre a TODOS los roles por igual, aunque un Coordinador/Docente/Administrador no "estudian" nada — quedaban vacíos y confusos. Se ocultan del menú si el rol tiene `enrollment:view` o `enrollment:create` (staff), sin tocar el acceso real a las pantallas (alguien con un rol de personal que ADEMÁS esté matriculado como alumno en otro curso sigue pudiendo entrar por URL directa).
- **Notas con filtros en cascada**: "Notas" (menú principal) ahora filtra por Periodo académico primero; dentro de un curso, la tabla de notas finales incluye la Sección de cada alumno y un filtro para ver solo una sección a la vez (filtrado del lado del cliente sobre la misma respuesta, sin un query param nuevo en el backend). El orden real es año → curso → sección (no año → sección → curso): una `Section` cuelga de un `Course`, nunca al revés.
- **Logo/fondo institucional como archivo real, no URL**: se detectó que pedir una URL a mano para el logo/fondo era poco práctico (¿de dónde saca esa URL una institución real?) — ahora se suben como archivo (`POST /tenant/logo`, `POST /tenant/background-image`), igual que la foto de perfil. Decisión de diseño clave: el bucket de MinIO/S3 NO es público (`storage.service.ts`), así que `Tenant.branding` guarda únicamente la **key** del archivo, nunca una URL firmada — guardar la URL firmada directamente habría quedado vencida a la hora (`getPresignedDownloadUrl` expira a los 3600s por defecto) justo en la página pública que nadie vuelve a "refrescar" del lado del servidor. En cambio, `GET /tenant` y `GET /tenant/public` regeneran la URL firmada fresca en cada respuesta (mismo patrón que el avatar en `profile.service.ts`). El color de fondo se mantiene como campo de texto simple (no es un archivo): es el respaldo que se usa mientras no haya imagen de fondo subida.
- **Auto-edición de perfil para quien ya administra otros**: `GET /profile` ahora también expone `userTenantId`; la pantalla "Mi perfil" lo usa para ofrecerse a sí misma como formulario editable (reusando el mismo `PATCH /users/:userTenantId/profile` de staff) cuando quien mira tiene `user_profile:edit` — no tendría sentido que alguien que ya puede corregir el perfil de cualquiera en su tenant no pueda corregir el propio sin ir a buscarse en "Usuarios y roles" primero.

## Qué sigue

Este es el cimiento del proyecto: estructura, entorno local, modelo de datos, aislamiento multi-tenant, **autenticación real contra Keycloak** (backend y frontend, con refresco automático de sesión), **motor de permisos (Casbin)**, los módulos de **Académico (con pantallas de creación de Periodo/Curso/Sección), Contenido de curso (con edición), Matrícula (individual y masiva, con sustento documental), Evaluaciones/Gradebook, Certificados (con plantilla fija por curso), Asistencia, Anotaciones de desempeño y Avance del alumno**, **alta de instituciones nuevas + personalización de marca**, un **panel de administración de roles y perfiles**, y un **frontend Next.js con pantallas de negocio reales** para todo lo anterior — todo validado de punta a punta con datos reales, incluida la subida de archivos. Los próximos pasos, en orden:

1. Cola de generación de certificados (BullMQ + worker separado) — hoy la emisión es SÍNCRONA dentro del request (ver la nota de simplificación del MVP en `certificate-renderer.service.ts`); pasar a una cola es trabajo de infraestructura genuino que se justifica cuando el volumen de emisiones lo requiera.
2. Clases en vivo integradas (hoy se resuelve con un recurso de tipo "link" a Zoom/Meet/YouTube, ver `content` módulo) y notificaciones por email (nueva calificación, certificado emitido).
3. Facturación/planes por institución — hoy `Tenant.plan` existe en el modelo pero no hay ningún flujo de cobro; necesario antes de operar con instituciones reales pagando.
4. Reportes/analítica agregados a nivel institución (no solo por alumno, que ya cubre "Avance") y SCORM/LTI para interoperar con contenido ya existente en otras plataformas.
5. Asistencia por QR (la asistencia manual ya está implementada, ver `modules/attendance`) y control de asistencia acumulado con alertas (hoy "Avance" muestra el % pero no dispara ninguna notificación si baja de un umbral).

Manuales de uso por rol, primeros pasos y resolución de problemas para personas no técnicas: ver [docs/manuales/](docs/manuales/README.md) (cubren exactamente lo que ya existe en pantalla; se amplían a medida que se agreguen las pantallas de la lista de arriba).

Ver el detalle completo de fases en [docs/architecture/06-roadmap.md](docs/architecture/06-roadmap.md).
