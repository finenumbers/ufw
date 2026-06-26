# Portainer deployment

Deploy with **Portainer** using pre-built **GHCR** images behind existing **Nginx Proxy Manager**.

NPM is not included in this stack.

## Prerequisites

- Docker host with Portainer and NPM running
- GHCR images from [releases](https://github.com/finenumbers/ufw/releases) (tag `latest` updated on each release)
- NPM Docker network name (e.g. `nginxproxymanager_default`)

Find NPM network:

```bash
docker network ls | grep -i proxy
docker inspect <npm_container> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

## Prepare environment variables

```bash
./scripts/generate-production-env.sh .env
```

Or copy [`.env.production.example`](../../../.env.production.example).

**Required:** `APP_URL`, `NPM_NETWORK`, `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `APP_ENCRYPTION_KEY`.

**Optional (images):** `GHCR_OWNER` (default `finenumbers`), `GHCR_IMAGE_TAG` (default `latest`). The stack file already points at `:latest` — you do not need image URLs in `.env` for normal deploys.

## Create stack

### Web editor

1. Portainer → **Stacks** → **Add stack**
2. Name: `ufw-remote-manager`
3. Paste [`deploy/portainer.stack.yml`](../../../deploy/portainer.stack.yml)
4. Environment variables → **Advanced mode** → paste `.env` contents (secrets only)
5. **Deploy the stack**

### Git repository

1. Repository URL: `https://github.com/finenumbers/ufw`
2. Compose path: `deploy/portainer.stack.yml`
3. Set environment in Portainer UI (never commit secrets to git)

## Configure NPM

See [Nginx Proxy Manager](./nginx-proxy-manager.md) — forward to `ufw-app:8088`.

## Upgrade (no file changes)

1. [Backup](../operations/backup-restore.md) Postgres and `.env`
2. Portainer → stack → **Update the stack**
3. Enable **Pull latest image** / **Re-pull image**
4. Deploy — containers use `ghcr.io/finenumbers/ufw-remote-manager:latest`

To **pin** a version instead of `latest`, set `GHCR_IMAGE_TAG=v0.2.1` in stack environment (optional).

## Verify

1. Stack containers healthy; `ufw-migrate` exited 0
2. Browser → `APP_URL/setup` or `/login`
3. `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

## Related docs

- [Upgrade and rollback](../operations/upgrade-rollback.md)
- [GHCR + Compose](./ghcr-compose.md)
- [Security model](../administration/security-model.md)
