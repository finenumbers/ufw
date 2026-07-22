# Развёртывание через Portainer

Deploy with **Portainer** using pre-built **GHCR** images behind existing **Nginx Proxy Manager**.

NPM is not included in this stack.

## Prerequisites

- Docker host with Portainer and NPM running
- GHCR images from [releases](https://github.com/finenumbers/ufw/releases) — tag `latest` updated each release; pin `GHCR_IMAGE_TAG=v0.9.2` if needed
- NPM Docker network name (e.g. `nginxproxymanager_default`)

```bash
docker network ls | grep -i proxy
docker inspect <npm_container> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

## Environment variables

```bash
./scripts/generate-production-env.sh .env
```

**Required:** `APP_URL`, `NPM_NETWORK`, `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `APP_ENCRYPTION_KEY`, `TRUST_PROXY=1`

**Optional:** `GHCR_OWNER`, `GHCR_IMAGE_TAG`, `PORT_SCAN_ENABLED=true`

## Create stack

### Web editor

1. Portainer → **Stacks** → **Add stack**
2. Name: `ufw-remote-manager`
3. Paste [`deploy/portainer.stack.yml`](../../../deploy/portainer.stack.yml)
4. Environment → **Advanced mode** → paste `.env` secrets
5. **Deploy the stack**

### Git repository

1. Repository: `https://github.com/finenumbers/ufw`
2. Compose path: `deploy/portainer.stack.yml`
3. Set environment in Portainer UI — never commit secrets

## Configure NPM

Forward Proxy Host to `ufw-app:8088` — see [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Verify

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

Open `APP_URL/setup` on first install.

## Связанные документы

- [GHCR + Compose](./ghcr-compose.md)
- [Обзор развёртывания](./overview.md)
