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

## GHCR deployment

| Variable | Description |
|----------|-------------|
| `GHCR_APP_IMAGE` | e.g. `ghcr.io/finenumbers/ufw-remote-manager:v0.1.0` |
| `GHCR_MIGRATE_IMAGE` | e.g. `ghcr.io/finenumbers/ufw-remote-manager-migrate:v0.1.0` |
| `IMAGE_TAG` | Tag for reference in docs/scripts |
| `GHCR_OWNER` | GitHub owner (lowercase), e.g. `finenumbers` |

## Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `SSH_ALLOWED_CIDRS` | Comma-separated CIDRs allowed as SSH targets | Empty (private IPs blocked) |
| `APP_BIND` | Local compose bind address | `127.0.0.1` |
| `APP_PORT` | Host port for local compose | `8088` |
| `POSTGRES_PORT` | Host port for Postgres in dev | `5434` |
| `LOG_LEVEL` | Pino log level | `info` |

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
