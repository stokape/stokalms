#!/bin/sh
# ============================================================================
# backup-postgres.sh — Backup diario de la base de datos de produccion.
#
# Ver la auditoria de seguridad, hallazgo "Backups" (Fase 20/26): antes,
# el respaldo solo vivia como un fragmento de codigo pegado dentro de
# docs/deploy/produccion.md, sin versionar ni probar — este script es ESE
# mismo respaldo, ahora versionado en el repo (mas facil de mantener/
# auditar) con un poco mas de robustez (falla ruidosamente si algo sale
# mal, en vez de un cron silencioso que nadie nota que dejo de funcionar).
#
# COMO SE USA en el servidor de produccion (ver docker-compose.prod.yml,
# servicio "postgres" — el contenedor se llama "stoka-postgres"):
#
#   1) Copialo a, por ejemplo, /root/scripts/backup-postgres.sh
#   2) chmod +x /root/scripts/backup-postgres.sh
#   3) Agregalo a cron (ej. "crontab -e"):
#        0 3 * * * /root/scripts/backup-postgres.sh >> /var/log/stoka-backup.log 2>&1
#
# RETENCION: 14 dias en el propio servidor (ver BACKUP_RETENTION_DAYS mas
# abajo) — un backup que vive SOLO en el mismo servidor que puede fallar
# (disco corrupto, servidor comprometido) no es un backup real. Baja estos
# .sql.gz regularmente a otro lugar (tu maquina, un bucket S3/R2 aparte) —
# este script deliberadamente NO lo hace por vos: la credencial de subida a
# donde sea que elijas guardarlos es una decision de infraestructura de
# CADA despliegue, no algo que este script deba adivinar.
#
# RESTORE: para probar que un backup realmente sirve (ver la nota de la
# auditoria: "un backup nunca restaurado no debe considerarse suficiente"):
#
#   gunzip -c /root/backups/stoka-2026-08-12.sql.gz | \
#     docker exec -i stoka-postgres psql -U stoka -d stoka_lms_restore_test
#
# (contra una base NUEVA "stoka_lms_restore_test", nunca sobre la real, para
# no arriesgar el dato en produccion solo por probar el backup).
# ============================================================================

set -eu

CONTAINER_NAME="${STOKA_POSTGRES_CONTAINER:-stoka-postgres}"
DB_USER="${POSTGRES_USER:-stoka}"
DB_NAME="${POSTGRES_DB:-stoka_lms}"
BACKUP_DIR="${STOKA_BACKUP_DIR:-/root/backups}"
BACKUP_RETENTION_DAYS="${STOKA_BACKUP_RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%F_%H%M%S)"
OUT_FILE="$BACKUP_DIR/stoka-$TIMESTAMP.sql.gz"
TMP_FILE="$OUT_FILE.tmp"

echo "[backup-postgres] $(date -Iseconds) Iniciando dump de \"$DB_NAME\" (contenedor \"$CONTAINER_NAME\")..."

# Se escribe primero a un archivo ".tmp" y recien se renombra al nombre
# final si "pg_dump" termina con exito — asi un dump que se corta a la
# mitad (disco lleno, contenedor reiniciado) nunca queda como si fuera un
# backup completo y valido.
if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$TMP_FILE"; then
  mv "$TMP_FILE" "$OUT_FILE"
  echo "[backup-postgres] $(date -Iseconds) OK: $OUT_FILE ($(du -h "$OUT_FILE" | cut -f1))"
else
  echo "[backup-postgres] $(date -Iseconds) ERROR: el dump fallo, no se genero un backup nuevo." >&2
  rm -f "$TMP_FILE"
  exit 1
fi

# Retencion: borra backups mas viejos que BACKUP_RETENTION_DAYS dentro de
# ESTE directorio unicamente (nunca toca nada fuera de "$BACKUP_DIR").
find "$BACKUP_DIR" -maxdepth 1 -name 'stoka-*.sql.gz' -mtime "+$BACKUP_RETENTION_DAYS" -print -delete
