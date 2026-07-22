# GHCR + Docker Compose

Pull pre-built images from GitHub Container Registry — recommended for production.

## Prerequisites

- Docker Compose v2
- `.env` from [`generate-production-env.sh`](../../../scripts/generate-production-env.sh)
- Nginx Proxy Manager on shared Docker network (`NPM_NETWORK`)

## Image names

```
ghcr.io/finenumbers/ufw-remote-manager:${GHCR_IMAGE_TAG:-latest}
ghcr.io/finenumbers/ufw-remote-manager-migrate:${GHCR_IMAGE_TAG:-latest}
```

Each GitHub release updates the `latest` tag. Pin `GHCR_IMAGE_TAG=v0.9.2` for fixed versions.

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

Validate rendered config:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env config
```

## Upgrade

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

Migrate runs automatically. v0.9.0+ removed legacy inventory tables — ensure migrate completes once when upgrading from older versions.

No `.env` changes required when staying on `latest`.

## Smoke test

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| `pull access denied` | Package visibility Public, or `docker login ghcr.io` |
| Migrate fails | Check logs: `docker compose logs migrate` |
| Health check fails | `docker compose logs app`; verify secrets and `APP_URL` |

## Связанные документы

- [Обзор развёртывания](./overview.md)
- [Обновление и откат](../operations/upgrade-rollback.md)
