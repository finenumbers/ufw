# Backup and restore

Protect **PostgreSQL data** and **`.env` secrets**. Remote UFW rules on managed servers are not stored in backups unless captured in snapshots inside the database.

## What to backup

| Item | Contains |
|------|----------|
| **Postgres volume** | Users, identities (encrypted), servers, rules, snapshots, scans, audit |
| **`.env` file** | `APP_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`, `POSTGRES_PASSWORD`, `APP_URL` |

Without `.env`, encrypted identity secrets cannot be decrypted after restore.

Optional: periodic [JSON v2 config export](../concepts/import-export-config.md) as human-readable disaster copy (includes decrypted secrets — encrypt at rest).

## Backup Postgres

Find volume:

```bash
docker volume ls | grep ufw
docker inspect ufw-postgres --format '{{range .Mounts}}{{.Name}}{{end}}'
```

Logical dump (recommended):

```bash
docker exec ufw-postgres pg_dump -U ufw ufw | gzip > ufw-$(date +%F).sql.gz
```

Store dump and `.env` in separate secure locations.

## Restore

1. Stop app: `docker compose ... stop app`
2. Restore database (into empty or fresh Postgres volume)
3. Restore `.env` with **same** `APP_ENCRYPTION_KEY` as when data was encrypted
4. `docker compose ... up -d`
5. Run [smoke tests](./smoke-tests.md)

## Related docs

- [Import and export config](../concepts/import-export-config.md)
- [Upgrade and rollback](./upgrade-rollback.md)
