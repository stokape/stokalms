# ============================================================================
# apps/api/Dockerfile — Imagen de produccion del backend (NestJS + Prisma +
# Playwright, este ultimo para renderizar los PDF de certificado, ver
# certificate-renderer.service.ts).
#
# Contexto de build: LA RAIZ DEL REPO, no esta carpeta — es un monorepo con
# npm workspaces (ver package.json raiz), y "npm ci" necesita ver el
# package.json de CADA workspace (apps/api, apps/web) para resolver el
# lockfile compartido correctamente. Se construye asi (ver
# docker-compose.prod.yml, que ya lo hace por ti):
#   docker build -f apps/api/Dockerfile -t stoka-api .
# ============================================================================

FROM node:20-bookworm-slim AS deps
WORKDIR /repo
# "-slim" no trae libssl visible para Prisma (avisa "Prisma failed to
# detect the libssl/openssl version..." y adivina una version al generar el
# cliente) — instalarlo explicito antes de "prisma generate" evita que
# adivine mal y el motor termine sin coincidir con el runtime real.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
# Solo los manifiestos primero: mientras no cambien package.json/lock, Docker
# reusa esta capa entera aunque cambie el codigo fuente (build mucho mas
# rapido en cada redeploy).
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

FROM deps AS build
COPY . .
RUN npx prisma generate --schema apps/api/prisma/schema.prisma
RUN npm run build --workspace apps/api

# ----------------------------------------------------------------------
# Runtime: imagen final. Sigue en la misma base "-slim" (no "-alpine")
# porque Playwright/Chromium requiere glibc, no la libc de Alpine (musl) —
# usar Alpine aca rompe el arranque de Chromium con errores dificiles de
# diagnosticar.
# ----------------------------------------------------------------------
FROM node:20-bookworm-slim AS runtime
WORKDIR /repo
ENV NODE_ENV=production
# Mismo motivo que en la etapa "deps": el cliente de Prisma generado ahi
# necesita encontrar esta misma libreria aca en tiempo de ejecucion.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# npm hoistea (casi) todo a /repo/node_modules en un monorepo de
# workspaces — copiar esa unica carpeta alcanza para que "node
# apps/api/dist/main.js" resuelva sus imports.
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma
COPY apps/api/package.json ./apps/api/package.json
# scripts/setup-keycloak.js y scripts/backup-postgres.sh se corren via
# "docker compose run --rm api node scripts/..." (ver docs/deploy/
# produccion.md) — sin copiar esta carpeta, ese comando falla con
# "Cannot find module" (se detecto haciendo el primer despliegue real).
COPY scripts ./scripts

# Instala Chromium + las librerias de sistema que necesita (fuentes,
# libnss3, etc.) — "--with-deps" corre apt-get por su cuenta. "playwright"
# esta hoisteado en /repo/node_modules (copiado arriba), por eso alcanza
# con invocarlo desde aca sin instalarlo de nuevo.
RUN npx playwright install --with-deps chromium

EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
