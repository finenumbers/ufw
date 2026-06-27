# GHCR + Docker Compose

Production images are published to **GitHub Container Registry (GHCR)**:

| Image | Purpose |
|-------|---------|
| `ghcr.io/finenumbers/ufw-remote-manager:TAG` | Next.js app |
| `ghcr.io/finenumbers/ufw-remote-manager-migrate:TAG` | Prisma migrations (one-shot) |

Each release publishes **`latest`** plus version tags (e.g. `v0.6.1`, `0.6.1`). Production deploys use **`latest`** by default — no version in `.env` required.

Replace `finenumbers` with your fork owner if you use a fork (`GHCR_OWNER` in `.env`).

## Universal images — APP_URL at runtime

Images are **domain-agnostic**. Set `APP_URL` in `.env` to your public HTTPS URL. No per-domain build required.

## Get images

### Option A — Git tag release (recommended)

```bash
git tag v0.7.4
git push origin v0.7.4
```

GitHub Actions publishes tagged images and updates `latest`. Packages must be **Public** on first use (GitHub → Packages → settings).

### Option B — Release (dispatch)

Actions → **Release (dispatch)** → enter `image_tag` (custom tag; does not update `latest` unless you tag `latest` manually).

## Prepare `.env` on the server

```bash
cp .env.production.example .env
# or
./scripts/generate-production-env.sh .env
```

Example (secrets required; image vars optional):

```bash
APP_URL=https://ufw.example.com
NPM_NETWORK=nginxproxymanager_default
POSTGRES_PASSWORD=...
BETTER_AUTH_SECRET=...
APP_ENCRYPTION_KEY=...
# Optional: GHCR_OWNER=finenumbers  GHCR_IMAGE_TAG=latest
```

Generate secrets:

```bash
openssl rand -base64 32   # BETTER_AUTH_SECRET, APP_ENCRYPTION_KEY
openssl rand -base64 24   # POSTGRES_PASSWORD
```

## Deploy

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.ghcr.yml \
  --env-file .env \
  pull

docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.ghcr.yml \
  --env-file .env \
  up -d
```

Validate:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env config
```

Configure NPM — see [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Upgrade

Redeploy with `docker compose ... pull && up -d` — no `.env` changes when using `latest`.

See [Upgrade and rollback](../operations/upgrade-rollback.md) to pin a version.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Auth redirect loops | `APP_URL` exactly matches NPM public URL |
| `pull access denied` | Package visibility Public, or `docker login ghcr.io` |
| `APP_URL is required` | `.env` loaded with `--env-file .env` |
| NPM 502 | App on `npm_proxy` network; container name `ufw-app` |

## Related docs

- [Deployment overview](./overview.md)
- [Smoke tests](../operations/smoke-tests.md)
