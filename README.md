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
            └── modules/          # Módulos de negocio (health, y los que siguen)
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

El frontend queda en `http://localhost:3000`: el botón "Iniciar sesión" redirige a Keycloak (usuario de prueba: `maria@stoka-lms.test` / `Maria12345!`), y al volver muestra `/dashboard`, que llama a `GET /api/v1/auth/me` del backend con el token real de la sesión.

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

## Qué sigue

Este es el cimiento del proyecto: estructura, entorno local, modelo de datos, aislamiento multi-tenant, **autenticación real contra Keycloak** (backend y frontend), **motor de permisos (Casbin)** y un **frontend Next.js con login funcional** — todo validado de punta a punta con un usuario real. Los próximos pasos, en orden:

1. Módulos de negocio: Académico (periodos/cursos/módulos), Matrícula, Evaluaciones/Gradebook, Certificados — reemplazando el controlador temporal `rbac-demo` (ver `apps/api/src/rbac/rbac-demo.controller.ts`).
2. Panel de administración para asignar roles a usuarios (hoy se hace manualmente en la base de datos; ver el ejemplo en el historial de commits).
3. Pantallas de negocio en el frontend (hoy solo existe la pantalla de prueba `/dashboard`).

Ver el detalle completo de fases en [docs/architecture/06-roadmap.md](docs/architecture/06-roadmap.md).
