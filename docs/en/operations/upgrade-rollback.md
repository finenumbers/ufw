# Upgrade and rollback

Stack: `ufw-postgres`, `ufw-migrate` (one-shot), `ufw-app`. Images are universal — set `APP_URL` in `.env` at runtime.

## Before every upgrade

1. [Backup](./backup-restore.md) Postgres and `.env`
2. Record current image tag: `grep IMAGE_TAG .env`
3. Read [release notes](https://github.com/finenumbers/ufw/releases)

## Upgrade (GHCR + Compose)

1. Update `.env`:

```bash
IMAGE_TAG=v0.2.0
GHCR_APP_IMAGE=ghcr.io/finenumbers/ufw-remote-manager:v0.2.0
GHCR_MIGRATE_IMAGE=ghcr.io/finenumbers/ufw-remote-manager-migrate:v0.2.0
```

2. Pull and redeploy:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

3. Verify: `docker logs ufw-migrate` (exit 0) and `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

Migrations run automatically via `ufw-migrate`.

## Upgrade (Portainer)

Update `GHCR_*_IMAGE` in stack environment → **Update the stack** (Pull & redeploy).

## Rollback

Prisma migrations are forward-only. If a new version applied irreversible schema changes, **restore Postgres from pre-upgrade backup** — do not only revert the image tag.

Safe image-only rollback (no destructive migration):

1. Revert `.env` image tags to previous version
2. `docker compose ... pull && docker compose ... up -d`
3. Smoke test

## Change APP_URL (domain move)

1. Update NPM Proxy Host
2. Change `APP_URL` in `.env`
3. `docker compose ... up -d app`

No image rebuild required. Users may need to log in again.

## Related docs

- [Backup and restore](./backup-restore.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
