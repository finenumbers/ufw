#!/usr/bin/env bash
set -euo pipefail

# Back up UFW Remote Manager Postgres database and optional .env file.
#
# Usage:
#   ./scripts/backup-postgres.sh
#   BACKUP_DIR=/var/backups/ufw ENV_FILE=.env ./scripts/backup-postgres.sh
#
# See docs/en/operations/backup-restore.md

BACKUP_DIR="${BACKUP_DIR:-./backups}"
ENV_FILE="${ENV_FILE:-}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-ufw-postgres}"
RETAIN_DAYS="${RETAIN_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

STAMP="$(date +%Y-%m-%d-%H%M)"
DUMP_PATH="${BACKUP_DIR}/ufw-${STAMP}.sql.gz"

if ! docker inspect "$POSTGRES_CONTAINER" >/dev/null 2>&1; then
  echo "Postgres container not found: $POSTGRES_CONTAINER" >&2
  exit 1
fi

echo "Writing ${DUMP_PATH} ..."
docker exec "$POSTGRES_CONTAINER" pg_dump -U ufw ufw | gzip >"$DUMP_PATH"
gzip -t "$DUMP_PATH"

if [[ -n "$ENV_FILE" && -f "$ENV_FILE" ]]; then
  ENV_BACKUP="${BACKUP_DIR}/env-${STAMP}.env"
  install -m 600 "$ENV_FILE" "$ENV_BACKUP"
  echo "Wrote ${ENV_BACKUP}"
fi

if [[ "$RETAIN_DAYS" =~ ^[0-9]+$ ]] && [[ "$RETAIN_DAYS" -gt 0 ]]; then
  find "$BACKUP_DIR" -type f \( -name 'ufw-*.sql.gz' -o -name 'env-*.env' \) -mtime +"$RETAIN_DAYS" -delete
fi

echo "Backup complete: ${DUMP_PATH}"
