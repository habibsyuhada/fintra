#!/bin/sh
# Nightly PostgreSQL backup for Fintra, run via cron on the VPS.
# Dumps the `postgres` service of the docker-compose stack, gzips it,
# and prunes backups older than RETENTION_DAYS.
#
# Usage: BACKUP_DIR=/var/backups/fintra RETENTION_DAYS=14 ./backup-db.sh
# Crontab example (03:00 daily):
#   0 3 * * * cd /opt/fintra && ./deploy/backup/backup-db.sh >> /var/log/fintra-backup.log 2>&1

set -eu

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/fintra}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
POSTGRES_USER="${POSTGRES_USER:-fintra}"
POSTGRES_DB="${POSTGRES_DB:-fintra}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_FILE="$BACKUP_DIR/fintra-${TIMESTAMP}.sql.gz"

echo "[$(date -u +%FT%TZ)] Starting backup -> $OUT_FILE"

docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$OUT_FILE"

echo "[$(date -u +%FT%TZ)] Backup complete ($(du -h "$OUT_FILE" | cut -f1))"

echo "[$(date -u +%FT%TZ)] Pruning backups older than ${RETENTION_DAYS} days"
find "$BACKUP_DIR" -name 'fintra-*.sql.gz' -mtime "+${RETENTION_DAYS}" -delete

echo "[$(date -u +%FT%TZ)] Done"
