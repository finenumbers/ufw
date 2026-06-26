# Upgrade and rollback

Stack: `ufw-postgres`, `ufw-migrate` (one-shot), `ufw-app`. Images are universal — set `APP_URL` in `.env` at runtime.

Default image tag is **`latest`** (updated on every GitHub release). You do not need to edit compose/stack files to upgrade.

## Before every upgrade

1. [Backup](./backup-restore.md) Postgres and `.env`
2. Read [release notes](https://github.com/finenumbers/ufw/releases)

## Upgrade (Portainer) — recommended

1. Portainer → **Stacks** → `ufw-remote-manager` → **Update the stack**
2. Enable **Pull latest image**
3. Deploy (no env changes if `GHCR_IMAGE_TAG` is unset or `latest`)
4. Verify: `ufw-migrate` exited 0, `ufw-app` healthy, smoke test

## Upgrade (GHCR + Compose)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

Migrations run automatically via `ufw-migrate`.

## Pin or rollback to a specific version

Set in `.env` or Portainer stack environment:

```bash
GHCR_IMAGE_TAG=v0.2.1
```

Then pull and redeploy. Omit `GHCR_IMAGE_TAG` (or set `latest`) to track the newest release again.

Prisma migrations are forward-only. If a new version applied irreversible schema changes, **restore Postgres from pre-upgrade backup** — do not only revert the image tag.

## Change APP_URL (domain move)

1. Update NPM Proxy Host
2. Change `APP_URL` in `.env`
3. Redeploy or `docker compose ... up -d app`

No image rebuild required. Users may need to log in again.

## Related docs

- [Backup and restore](./backup-restore.md)
- [Portainer deployment](../deployment/portainer.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
