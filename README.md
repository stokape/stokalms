# Stoka LMS

Plataforma SaaS multi-tenant de gestión de aprendizaje (LMS) para entidades educativas — institutos, universidades, centros de capacitación y academias.

## Documentación

- [`docs/architecture/`](docs/architecture/README.md) — arquitectura técnica completa (stack, modelo de datos, RBAC, flujos, API, roadmap, infraestructura) con sus [ADRs](docs/architecture/adr/).
- [`docs/guia-para-no-tecnicos.md`](docs/guia-para-no-tecnicos.md) — la misma información explicada sin jerga técnica, con ejemplos.

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
            └── modules/
                ├── health/       # Endpoint de salud
                ├── academic/     # Periodos, Cursos, Secciones
                ├── enrollment/   # Matrícula individual
                └── gradebook/    # Escalas, categorías, evaluaciones, entregas, notas
    └── web/                      # Frontend Next.js
        ├── auth.ts               # Configuración de NextAuth.js (proveedor Keycloak)
        └── app/
            ├── page.tsx          # Inicio (login/logout)
            ├── dashboard/        # Página protegida: llama a /auth/me del backend
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

## Endpoints de negocio disponibles

Todos protegidos con `JwtAuthGuard` + `PermissionsGuard` (ver `docs/architecture/03-rbac.md`):

| Recurso | Endpoints |
|---|---|
| Periodos académicos | `POST/GET /terms`, `GET/PATCH/DELETE /terms/:id` |
| Cursos | `POST/GET /courses`, `GET/PATCH/DELETE /courses/:id` |
| Secciones | `POST/GET /courses/:courseId/sections`, `GET/PATCH/DELETE /courses/:courseId/sections/:id` |
| Matrícula | `POST/GET /courses/:courseId/sections/:sectionId/enrollments`, `PATCH .../enrollments/:id` (cambia estado: active/dropped/completed) |
| Escalas de notas | `POST/GET /grading-scales`, `GET/PATCH/DELETE /grading-scales/:id` |
| Categorías de calificación | `POST/GET /courses/:courseId/gradebook-categories`, `GET/PATCH/DELETE .../gradebook-categories/:id` |
| Evaluaciones | `POST/GET /courses/:courseId/assessments`, `GET/PATCH/DELETE .../assessments/:id` |
| Preguntas | `POST/GET /courses/:courseId/assessments/:assessmentId/questions`, `PATCH/DELETE .../questions/:id` (oculta `correctAnswer` a quien no tenga `assessment:edit`) |
| Entregas | `POST/GET .../assessments/:assessmentId/submissions` (auto-califica mcq/tf/matching), `PATCH .../submissions/:id/answers/:questionId` (calificación manual de preguntas abiertas) |
| Notas finales | `POST /courses/:courseId/gradebook/publish` (calcula y publica), `GET /courses/:courseId/grades` (vista completa o solo propia, según permisos) |

Notas importantes encontradas al probar contra el sistema real (no solo revisando el código):
- El `onDelete: Cascade` por defecto de Prisma borraba en cascada cursos/secciones/matrículas/notas/certificados al borrar su registro padre, sin avisar. Se cambió a `onDelete: Restrict` en toda la cadena académica (ver los comentarios en `schema.prisma`, empezando por el modelo `Course`), y se agregó un filtro global (`common/filters/prisma-exception.filter.ts`) que traduce ese error a un `409 Conflict` claro en vez de un `500` genérico.
- El `ValidationPipe` global (`forbidNonWhitelisted: true`) rechazaba el campo `answer` de una entrega porque no tenía ningún decorador de `class-validator` — cualquier campo de un DTO que acepte JSON libre necesita al menos `@IsDefined()` para no ser tratado como "no permitido" (ver `submit-assessment.dto.ts`).
- La nota final de un curso (ponderada por categorías, con `dropLowest`) **no se guarda** en su propia tabla: se recalcula cada vez a partir de las notas individuales por evaluación, para evitar dos fuentes de verdad desincronizadas (ver `gradebook.service.ts`).

## Qué sigue

Este es el cimiento del proyecto: estructura, entorno local, modelo de datos, aislamiento multi-tenant, **autenticación real contra Keycloak** (backend y frontend), **motor de permisos (Casbin)**, un **frontend Next.js con login funcional**, y los módulos de **Académico, Matrícula y Evaluaciones/Gradebook** — todo validado de punta a punta con datos reales (incluyendo el cálculo ponderado de la nota final). Los próximos pasos, en orden:

1. Certificados (generación automática, plantillas, verificación pública por QR) — ver `docs/architecture/04-flujos-criticos.md`, sección 4.3.
2. Matrícula masiva (CSV/Excel) — hoy solo existe la individual.
3. Panel de administración para asignar roles a usuarios (hoy se hace manualmente en la base de datos; ver el ejemplo en el historial de commits).
4. Pantallas de negocio en el frontend (hoy solo existe la pantalla de prueba `/dashboard`).

Ver el detalle completo de fases en [docs/architecture/06-roadmap.md](docs/architecture/06-roadmap.md).
