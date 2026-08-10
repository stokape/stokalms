# ============================================================================
# apps/web/Dockerfile — Imagen de produccion del frontend (Next.js App
# Router, Server Components + Server Actions, ver next.config.ts).
#
# Contexto de build: LA RAIZ DEL REPO (igual que apps/api/Dockerfile) — ver
# la nota alli sobre por que un monorepo de npm workspaces lo exige. Se
# construye asi (docker-compose.prod.yml ya lo hace por ti):
#   docker build -f apps/web/Dockerfile -t stoka-web .
# ============================================================================

FROM node:20-bookworm-slim AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

FROM deps AS build
COPY . .
# "next build" con output:"standalone" (ver next.config.ts) genera
# ".next/standalone" con SOLO los archivos/paquetes que la app realmente
# importa (Next.js rastrea el arbol de imports) — resuelve el problema de
# los node_modules hoisteados del monorepo sin tener que arrastrar todo
# /repo/node_modules (que incluiria, entre otras cosas, Playwright/Chromium
# de apps/api) a la imagen final.
RUN npm run build --workspace apps/web

# ----------------------------------------------------------------------
# Runtime: imagen final minima — "standalone" ya trae su propio
# node_modules recortado, no hace falta "npm ci" ni copiar el monorepo
# entero aca.
# ----------------------------------------------------------------------
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# El output "standalone" de Next.js reproduce la estructura del monorepo
# (server.js queda en apps/web/server.js, no en la raiz) porque rastrea
# imports desde la raiz del workspace — por eso se copia tal cual y se
# arranca desde esa subcarpeta.
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
