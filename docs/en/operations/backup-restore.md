# Backup and restore

All application state lives in **PostgreSQL** (`ufw-postgres`, volume `ufw_postgres_data`). Runtime secrets live in **`.env`** on the host.

## What to back up

| Item | Required for full recovery |
|------|---------------------------|
| Postgres dump | Yes |
| `.env` file | Yes — `APP_ENCRYPTION_KEY` decrypts SSH credentials |
| Config export JSON | Optional plaintext disaster copy |

Never commit backups to git.

## Find the volume

```bash
docker volume ls | grep ufw
docker inspect ufw-postgres --format '{{range .Mounts}}{{.Name}}{{end}}'
```

## Backup

### Automated script

```bash
BACKUP_DIR=/var/backups/ufw ENV_FILE=.env ./scripts/backup-postgres.sh
```

### Manual SQL dump

```bash
docker exec ufw-postgres pg_dump -U ufw ufw | gzip > ufw-$(date +%F).sql.gz
install -m 600 .env env-$(date +%F).env
```

## Restore

1. Stop app: `docker compose ... stop app`
2. Restore database from dump (see detailed steps in legacy runbook — drop/recreate DB if clean restore needed)
3. Restore matching `.env` (same `APP_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`)
4. `docker compose ... up -d`
5. `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

Without the original `APP_ENCRYPTION_KEY`, re-enter SSH identity secrets manually or restore from plaintext config export.

## Disaster recovery checklist

1. Restore `.env` from secure backup
2. Restore Postgres dump
3. Confirm `ufw-migrate` exits 0
4. Login at `APP_URL/login`
5. SSH test on each server

## Related docs

- [Upgrade and rollback](./upgrade-rollback.md)
- [Import and export config](../concepts/import-export-config.md)
