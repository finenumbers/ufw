# Backup and restore

UFW Remote Manager stores all application state in **PostgreSQL** (`ufw-postgres` container, volume `ufw_postgres_data`).

Runtime secrets (`.env`) are **not** in the database. You need both a **database dump** and a **secure copy of `.env`** to recover fully.

## What to back up

| Item | Contains | Required for restore |
|------|----------|-------------------|
| Postgres dump | Users, sessions, servers, encrypted SSH credentials, rules, audit log | Yes |
| `.env` file | `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `APP_ENCRYPTION_KEY`, `APP_URL` | Yes — without `APP_ENCRYPTION_KEY` SSH credentials cannot be decrypted |
| Config export (optional) | Plaintext SSH secrets in JSON | Optional disaster copy — treat like a secret |

Never commit dumps or `.env` to git. Store off-host (encrypted object storage, password manager vault file, etc.).

## Find the Postgres volume

Volume name depends on the Compose project / Portainer stack name:

```bash
docker volume ls | grep ufw
docker inspect ufw-postgres --format '{{range .Mounts}}{{.Name}} → {{.Destination}}{{"\n"}}{{end}}'
```

Typical names: `ufw_ufw_postgres_data`, `ufw-remote-manager_ufw_postgres_data`.

---

## Backup (recommended: daily)

### SQL dump (portable)

```bash
BACKUP_DIR=/var/backups/ufw-remote-manager
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

STAMP="$(date +%Y-%m-%d-%H%M)"
docker exec ufw-postgres pg_dump -U ufw ufw \
  | gzip > "$BACKUP_DIR/ufw-${STAMP}.sql.gz"
```

### Custom format (faster restore, supports parallel restore)

```bash
docker exec ufw-postgres pg_dump -U ufw -Fc ufw \
  > "$BACKUP_DIR/ufw-${STAMP}.dump"
```

### Backup `.env`

```bash
install -m 600 .env "$BACKUP_DIR/env-${STAMP}.env"
```

### Cron example

```cron
0 3 * * * root /opt/ufw-remote-manager/scripts/backup-postgres.sh
```

See [`scripts/backup-postgres.sh`](../../scripts/backup-postgres.sh) for a ready-made script.

### Verify a backup

```bash
gzip -t /var/backups/ufw-remote-manager/ufw-2025-06-23.sql.gz
# or for custom format:
docker run --rm -i postgres:16-alpine pg_restore -l < ufw-2025-06-23.dump | head
```

---

## Restore

**Stop the app** before restoring to avoid concurrent writes.

### Compose (GHCR production)

```bash
cd /path/to/ufw-remote-manager   # or your deploy directory

docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.ghcr.yml \
  --env-file .env \
  stop app
```

### Restore from SQL dump

```bash
gunzip -c /var/backups/ufw-remote-manager/ufw-2025-06-23.sql.gz \
  | docker exec -i ufw-postgres psql -U ufw -d ufw
```

For a **clean** restore into an empty database:

```bash
docker compose ... stop app

docker exec ufw-postgres psql -U ufw -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'ufw' AND pid <> pg_backend_pid();"

docker exec ufw-postgres psql -U ufw -d postgres -c "DROP DATABASE IF EXISTS ufw;"
docker exec ufw-postgres psql -U ufw -d postgres -c "CREATE DATABASE ufw OWNER ufw;"

gunzip -c /var/backups/ufw-remote-manager/ufw-2025-06-23.sql.gz \
  | docker exec -i ufw-postgres psql -U ufw -d ufw

docker compose ... up -d
```

### Restore from custom format

```bash
docker compose ... stop app

cat /var/backups/ufw-remote-manager/ufw-2025-06-23.dump \
  | docker exec -i ufw-postgres pg_restore -U ufw -d ufw --clean --if-exists
```

### After restore

1. Ensure `.env` matches the backup era (`APP_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`, `POSTGRES_PASSWORD`).
2. Start the stack: `docker compose ... up -d`
3. Run smoke test: `./scripts/smoke-production.sh --env-file .env --ghcr`
4. Log in and verify servers / SSH test on one host.

---

## Disaster recovery checklist

1. Restore `.env` (or recreate with **same** `APP_ENCRYPTION_KEY` from backup).
2. Deploy stack (Postgres volume may be empty or corrupted — restore dump).
3. Confirm `ufw-migrate` exits 0 (schema matches app version).
4. Open `APP_URL/login` — existing users should authenticate if `BETTER_AUTH_SECRET` matches backup.
5. SSH credentials work only if `APP_ENCRYPTION_KEY` matches backup.

---

## Related docs

- [Upgrade and rollback](./upgrade-rollback.md)
- [GHCR deploy](../deploy/ghcr.md)
- [SECURITY.md](../../SECURITY.md)
