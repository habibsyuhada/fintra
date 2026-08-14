#!/bin/sh
# Restore a Fintra PostgreSQL backup produced by backup-db.sh.
# WARNING: this overwrites the target database's contents.
#
# Usage: ./restore-db.sh /var/backups/fintra/fintra-20260814T030000Z.sql.gz

set -eu

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
POSTGRES_USER="${POSTGRES_USER:-fintra}"
POSTGRES_DB="${POSTGRES_DB:-fintra}"

FILE="${1:?Usage: restore-db.sh <path-to-backup.sql.gz>}"

echo "About to restore $FILE into database '$POSTGRES_DB'. This will overwrite existing data."
printf 'Type "yes" to continue: '
read -r CONFIRM
[ "$CONFIRM" = "yes" ] || { echo "Aborted."; exit 1; }

gunzip -c "$FILE" | docker compose -f "$COMPOSE_FILE" exec -T postgres \
  psql -U "$POSTGRES_USER" "$POSTGRES_DB"

echo "Restore complete."
