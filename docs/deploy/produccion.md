# Despliegue de producción — una sola VM Linux

Guía paso a paso para poner Stoka LMS en producción en una sola VM (Oracle
Cloud "Always Free" si te aprueban la cuenta; si no, cualquier VPS con
Ubuntu 24.04 y acceso root sirve igual — DigitalOcean/Vultr/Linode aprueban
la cuenta al instante, sin la revisión manual que a veces traba a Oracle),
con HTTPS automático (Let's Encrypt) para el dominio raíz, cada subdominio
de institución y cada dominio propio que se verifique desde `/dominios`.
Usa `docker-compose.prod.yml` + `Caddyfile` + `.env.production` (ver esos
archivos en la raíz del repo — comentados por dentro, esta guía es el
"orden de los pasos").

No requiere Kubernetes ni varios servicios cloud distintos: todo corre en
la misma VM, con los mismos contenedores que documenta
[docs/architecture/07-infraestructura.md](../architecture/07-infraestructura.md)
para la etapa "MVP / pocos tenants" — migrar después a servicios managed
(RDS, etc.) no exige reescribir nada, son los mismos contenedores. Los
archivos (logos, PDFs de certificado, SCORM) sí quedan en Cloudflare R2
desde el principio, no en esta VM — ver la sección 4.

## 0. Qué vas a necesitar

- **Un dominio propio** (no es gratis — ~US$10-15/año en cualquier
  registrador: Namecheap, Cloudflare Registrar, etc.). Sin esto no hay
  forma de tener HTTPS real ni subdominios por institución.
- **Una VM Linux con Ubuntu 24.04 y acceso root** — Oracle Cloud "Always
  Free" (gratis, pero la aprobación de cuenta puede tardar o quedar en
  revisión) o cualquier VPS de pago instantáneo (DigitalOcean/Vultr/Linode,
  ~US$20-24/mes por 4GB RAM/2vCPU) si no podés esperar a Oracle.
- **Una cuenta de Cloudflare** (la misma que uses para el DNS del dominio
  alcanza) con un bucket de **R2** creado — gratis hasta 10GB y sin costo
  de salida, ver la sección 4.
- ~45-60 minutos la primera vez.

## 1. Crear la VM en Oracle Cloud

Si la cuenta de Oracle está trabada en revisión (le pasa a bastante gente
con la capacidad ARM gratis) o no querés esperar, saltate esta sección:
creá un droplet/instancia Ubuntu 24.04 en DigitalOcean, Vultr o Linode
(aprueban la cuenta al instante con tarjeta, ~US$20-24/mes por 4GB RAM/2vCPU)
y segui directo desde la sección 2 — el resto de la guía es igual, no
depende de qué proveedor eligas.

1. [cloud.oracle.com](https://cloud.oracle.com) → crear cuenta (elegir la
   región más cercana a tus instituciones — Oracle no permite cambiarla
   después sin recrear todo).
2. **Compute → Instances → Create Instance**.
3. Shape: **VM.Standard.A1.Flex** (Ampere/ARM, "Always Free eligible") —
   asignale los 4 OCPU / 24 GB que da el tier gratis (alcanza de sobra
   para Postgres + Keycloak + api + web + Caddy juntos).
4. Imagen: **Ubuntu 24.04** (o la LTS más reciente disponible).
5. En "Add SSH keys", sube tu clave pública (o generá una nueva ahí mismo
   y guarda la privada) — es como vas a entrar por SSH.
6. Creala y anota la **IP pública** que le asigna.
7. **Networking → Virtual Cloud Network → tu VCN → Security Lists** →
   agrega reglas de ingreso (Ingress Rules) para los puertos **80** y
   **443**, origen `0.0.0.0/0`, TCP — sin esto, aunque Docker publique los
   puertos, el firewall de Oracle los bloquea igual (es la causa más común
   de "no carga nada" en Oracle Cloud).

## 2. Apuntar el DNS

En el panel de tu dominio, crea estos registros **A**, todos apuntando a
la IP pública de la VM:

| Nombre | Apunta a |
|---|---|
| `tudominio.com` (raíz) | IP de la VM |
| `auth.tudominio.com` | IP de la VM |
| `api.tudominio.com` | IP de la VM |
| `*.tudominio.com` (wildcard) | IP de la VM |

(Sin `storage.tudominio.com`: los archivos viven en Cloudflare R2, no en
esta VM — ver la sección 4 y el paso 3 de más abajo. R2 tiene su propio
endpoint público, no hace falta un registro DNS propio para él.)

El wildcard es lo que hace que **cualquier institución nueva que se
apruebe** (subdominio nuevo, ver `tenant-domain.service.ts`) funcione sin
volver a tocar el DNS nunca más — Caddy le emite un certificado la primera
vez que alguien lo visita (ver `Caddyfile`, `on_demand_tls`).

Los DNS pueden tardar de minutos a un par de horas en propagarse.

## 3. Preparar el servidor

```bash
ssh ubuntu@IP_DE_TU_VM

# Docker + el plugin de Compose (Ubuntu 24.04 los trae en sus repos):
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 git
sudo usermod -aG docker $USER
newgrp docker

git clone <URL-de-tu-repo> stoka-lms
cd stoka-lms
```

## 4. Completar `.env.production`

```bash
cp .env.production.example .env.production
nano .env.production   # completar cada valor (ver los comentarios ahi mismo)
```

Puntos que NO son obvios:
- `KEYCLOAK_CLIENT_SECRET` / `AUTH_KEYCLOAK_SECRET` se completan **después**
  del paso 6 (Keycloak todavía no existe en este punto) — dejalos con el
  valor de ejemplo por ahora.
- `AUTH_SECRET`: generalo ahora con `openssl rand -base64 32`.
- Las contraseñas de Postgres/Keycloak admin: cualquier generador de
  contraseñas largo alcanza (`openssl rand -base64 24`, por ejemplo).
- `STORAGE_ENDPOINT`/`STORAGE_ACCESS_KEY`/`STORAGE_SECRET_KEY`: creá el
  bucket y el API token de Cloudflare R2 ANTES de este paso (ver los
  comentarios de `.env.production.example`, sección "Archivos") — sin esto
  completado, ningún upload va a funcionar (logos, certificados, adjuntos).

## 5. Primer inicio, EN ORDEN (no todo junto)

Postgres/Keycloak tienen que estar arriba y sanos antes de correr
migraciones o crear el realm — por eso esto va en pasos, no un solo
`docker compose up -d` de entrada.

```bash
# 1) Solo la infraestructura de base:
docker compose -f docker-compose.prod.yml --env-file .env.production \
  up -d postgres redis keycloak

# 2) Esperar ~30s a que Keycloak termine de iniciar (verificar con):
docker compose -f docker-compose.prod.yml logs -f keycloak
# (Ctrl+C cuando veas "Keycloak <versión> on JVM ... started")

# 3) Construir las imagenes de api/web (tarda varios minutos la primera vez):
docker compose -f docker-compose.prod.yml --env-file .env.production build api web

# 4) Migraciones + RLS + catalogo de roles/permisos — usando la imagen de
#    "api" recien construida, sin levantarla todavia como servicio:
docker compose -f docker-compose.prod.yml --env-file .env.production \
  run --rm api npx prisma migrate deploy --schema apps/api/prisma/schema.prisma

docker compose -f docker-compose.prod.yml --env-file .env.production \
  run --rm api node apps/api/prisma/apply-rls.js

docker compose -f docker-compose.prod.yml --env-file .env.production \
  run --rm api node apps/api/prisma/seed.js
# (el seed tambien crea un tenant "de desarrollo" con dominio
# sanmartin.localhost — inofensivo en produccion, nadie va a tener DNS
# apuntando ahi; podes borrar esa fila de "tenants" mas adelante si te
# molesta verla).

# 5) Crear el realm de Keycloak + los clientes stoka-api/stoka-web (ESTA
#    vez con el dominio real, no localhost):
docker compose -f docker-compose.prod.yml --env-file .env.production \
  run --rm -e KEYCLOAK_BASE_URL=https://auth.tudominio.com \
  -e WEB_ORIGIN=https://tudominio.com -e KEYCLOAK_SEED_TEST_USERS=false \
  api node scripts/setup-keycloak.js
```

Ese último comando imprime **"Secreto backend"** y **"Secreto frontend"** —
copialos a `KEYCLOAK_CLIENT_SECRET` y `AUTH_KEYCLOAK_SECRET` dentro de
`.env.production` ahora.

```bash
# 6) Recien ahora, todo junto (incluido Caddy, que emite los certificados):
docker compose -f docker-compose.prod.yml --env-file .env.production \
  up -d --build
```

Verifica con `docker compose -f docker-compose.prod.yml logs -f caddy` que
no haya errores de emisión de certificado (la primera visita a
`https://tudominio.com` puede tardar unos segundos extra mientras Caddy
pide el certificado por primera vez).

## 6. Primera institución y primer Super Admin

Es el mismo flujo que en desarrollo (ver
[docs/manuales/inscribir-tu-institucion.md](../manuales/inscribir-tu-institucion.md)),
con una limitación **ya conocida y documentada** (ver "Qué sigue" en el
[README](../../README.md)): al aprobar una institución desde
`/admin-plataforma` (tu email, el de `PLATFORM_ADMIN_EMAILS`), el
Administrador de entidad queda creado en la base de datos de Stoka LMS
pero **todavía no en Keycloak** — hay que crearle el usuario a mano una vez
(panel `/admin` de Keycloak, `https://auth.tudominio.com/admin`, con
`KEYCLOAK_ADMIN_USER`/`KEYCLOAK_ADMIN_PASSWORD`) antes de que esa persona
pueda iniciar sesión por primera vez.

## Redeploy (cambios futuros)

```bash
cd stoka-lms
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production build api web
docker compose -f docker-compose.prod.yml --env-file .env.production \
  run --rm api npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

## Backups

Automatización mínima (ver `scripts/backup-postgres.sh`, versionado en el
repo — ver la auditoría de seguridad, hallazgo "Backups"): sigue siendo
"a escala pequeña", ver la tabla de "Backups y recuperación" en
[07-infraestructura.md](../architecture/07-infraestructura.md) para la
versión "a escala" con point-in-time recovery. Para arrancar, en la VM:

```bash
# Copiar el script y darle permiso de ejecución:
scp scripts/backup-postgres.sh root@tu-servidor:/root/scripts/backup-postgres.sh
ssh root@tu-servidor chmod +x /root/scripts/backup-postgres.sh

# Agregarlo a cron (corre todos los días a las 3am):
crontab -e
# 0 3 * * * /root/scripts/backup-postgres.sh >> /var/log/stoka-backup.log 2>&1
```

Retiene 14 días localmente por defecto (`STOKA_BACKUP_RETENTION_DAYS`) y
escribe a `/root/backups` (`STOKA_BACKUP_DIR`) — ambos configurables por
variable de entorno, ver los comentarios del script. Bajate esos `.sql.gz`
a otro lugar (tu máquina, un bucket) de tanto en tanto — un backup que vive
solo en el mismo servidor que puede fallar no es un backup real.

**Probá la restauración de verdad** al menos una vez (el script trae el
comando exacto en su propio comentario, contra una base `_restore_test`
aparte, nunca la real) — un backup nunca restaurado no debe considerarse
suficiente.

## Problemas comunes

- **"no se puede conectar" desde el navegador**: revisa primero las
  Security Lists de Oracle (paso 1.7) — es el error más común, todo lo
  demás puede estar perfecto y esto igual bloquea todo.
- **Error de "issuer" al iniciar sesión**: `KEYCLOAK_BASE_URL` (api),
  `AUTH_KEYCLOAK_ISSUER` (web, se arma solo desde `AUTH_DOMAIN` +
  `KEYCLOAK_REALM`) y `KC_HOSTNAME` (Keycloak) tienen que ser EXACTAMENTE
  el mismo dominio — un typo entre `www.` de más o de menos ya lo rompe.
- **Caddy no emite certificado para un dominio propio nuevo**: confirma
  que ese dominio ya está `verified: true` en `/dominios` (ver
  `domain-check.controller.ts` — Caddy le pregunta a la API antes de
  pedirle nada a Let's Encrypt) y que su DNS ya apunta a la IP del
  servidor.
