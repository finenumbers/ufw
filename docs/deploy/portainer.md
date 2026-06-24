# Portainer deployment

Deploy UFW Remote Manager with **Portainer** using a pre-built **GHCR** image behind an existing **Nginx Proxy Manager (NPM)** installation.

NPM is not included in this stack.

## Prerequisites

- Docker host with Portainer and NPM already running
- GHCR images from releases work for any domain — set `APP_URL` in `.env` ([ghcr.md](./ghcr.md))
- NPM Docker network name (e.g. `nginxproxymanager_default`)

Find NPM network:

```bash
docker network ls | grep -i proxy
docker inspect <npm_container> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

## 1. Prepare environment variables

Generate a local `.env` on the server (never commit):

```bash
./scripts/generate-production-env.sh .env
```

Or copy [`.env.production.example`](../../.env.production.example) and fill in values.

Required variables:

| Variable | Example |
|----------|---------|
| `APP_URL` | `https://ufw.example.com` |
| `NPM_NETWORK` | `nginxproxymanager_default` |
| `GHCR_APP_IMAGE` | `ghcr.io/owner/ufw-remote-manager:v1.0.0-prod` |
| `GHCR_MIGRATE_IMAGE` | `ghcr.io/owner/ufw-remote-manager-migrate:v1.0.0-prod` |
| `POSTGRES_PASSWORD` | strong random |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | `openssl rand -base64 32` |

## 2. Create stack in Portainer

### Option A — Web editor (simplest)

1. Portainer → **Stacks** → **Add stack**
2. Name: `ufw-remote-manager`
3. Build method: **Web editor**
4. Paste contents of [`deploy/portainer.stack.yml`](../../deploy/portainer.stack.yml)
5. Scroll to **Environment variables** → **Advanced mode**
6. Paste variables from your `.env` file (key=value, one per line)
7. **Deploy the stack**

### Option B — Git repository

1. Portainer → **Stacks** → **Add stack**
2. Build method: **Repository**
3. Repository URL: your public GitHub repo URL
4. Compose path: `deploy/portainer.stack.yml`
5. Set environment variables in Portainer UI (do not store secrets in the repo)
6. **Deploy the stack**

## 3. Configure NPM

In the existing NPM UI, create a **Proxy Host**:

| Field | Value |
|-------|-------|
| Domain Names | host from `APP_URL` |
| Scheme | `http` |
| Forward Hostname / IP | `ufw-app` |
| Forward Port | `3000` |
| Websockets Support | enabled |
| Block Common Exploits | recommended |
| SSL | Let's Encrypt or existing cert |
| Force SSL | recommended |

## 4. Verify

1. Portainer → stack → all containers healthy / migrate exited 0
2. Browser → `APP_URL/setup` (first admin) or `/login`
3. Create SSH identity → add server → test connection

Health check:

```bash
docker exec ufw-app node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>r.json()).then(console.log)"
```

## Upgrade

See [operations/upgrade-rollback.md](../operations/upgrade-rollback.md).

1. Pull new GHCR images ([Release](../../.github/workflows/release.yml) or [dispatch](../../.github/workflows/release-dispatch.yml))
2. Portainer → stack → **Editor** → update `GHCR_*_IMAGE` tags in environment
3. **Update the stack** (Pull & redeploy)
4. `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

## Backup

See [operations/backup-restore.md](../operations/backup-restore.md).

Quick backup:

```bash
./scripts/backup-postgres.sh
# or
BACKUP_DIR=/var/backups/ufw ENV_FILE=.env ./scripts/backup-postgres.sh
```

## Security notes

- Keep Portainer and NPM admin UIs restricted (VPN / IP allowlist)
- Do not paste real `.env` contents into public tickets or git
- Rotate secrets if `.env` or config export may have leaked

See also [SECURITY.md](../../SECURITY.md) and [production-npm.md](../production-npm.md).
