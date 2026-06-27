# Environment variables

Runtime configuration is supplied via `.env` (Compose) or Portainer environment UI. **Never commit real values to git.**

## Required (production)

| Variable | Description | Generate |
|----------|-------------|----------|
| `APP_URL` | Public HTTPS URL of the admin UI | Your NPM domain, e.g. `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Database password | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Session signing secret | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | AES key for SSH credentials (32 decoded bytes) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Docker network name shared with NPM | `docker network ls` |

## GHCR deployment (optional)

Compose and Portainer stack default to `ghcr.io/finenumbers/ufw-remote-manager:latest`. Each GitHub release updates the `latest` tag.

| Variable | Description | Default |
|----------|-------------|---------|
| `GHCR_OWNER` | GitHub owner (lowercase) | `finenumbers` |
| `GHCR_IMAGE_TAG` | Image tag (`latest` or pin e.g. `v0.2.1`) | `latest` |

Legacy `GHCR_APP_IMAGE` / `GHCR_MIGRATE_IMAGE` / `IMAGE_TAG` are no longer required — image URLs are built from owner + tag in compose files.

## Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `SSH_ALLOWED_CIDRS` | Comma-separated CIDRs allowed as SSH targets | Empty (private IPs blocked) |
| `APP_BIND` | Local compose bind address | `127.0.0.1` |
| `APP_PORT` | Host port for local compose | `8088` |
| `POSTGRES_PORT` | Host port for Postgres in dev | `5434` |
| `LOG_LEVEL` | Pino log level | `info` |

## Rate limits (fixed)

Repeat server actions use a **30 second** cooldown per server (not configurable via environment variables):

- UFW status refresh and rules sync
- Port scan start
- Docker inventory refresh
- Docker container start, stop, restart

Since **v0.5.1**, legacy variables such as `PORT_SCAN_RATE_LIMIT_WINDOW_MS`, `DOCKER_REFRESH_RATE_LIMIT_WINDOW_MS`, and `DOCKER_CONTROL_RATE_LIMIT_WINDOW_MS` are **ignored** if still present in `.env`.

## How variables reach containers

In `docker-compose.yml`:

```yaml
APP_URL: ${APP_URL:-http://localhost:8088}
BETTER_AUTH_URL: ${APP_URL:-http://localhost:8088}
```

The app reads `APP_URL` or `BETTER_AUTH_URL` at runtime (`getPublicAppUrl()`).

## Templates and generators

- [`.env.example`](../../../.env.example) — local development
- [`.env.production.example`](../../../.env.production.example) — production template
- [`scripts/generate-production-env.sh`](../../../scripts/generate-production-env.sh) — interactive generator

## Related docs

- [Security model](./security-model.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
