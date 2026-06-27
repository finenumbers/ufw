# Environment variables

Runtime configuration is supplied via `.env` (Compose) or Portainer environment UI. **Never commit real values to git.**

## Required (production)

| Variable | Description | Generate |
|----------|-------------|----------|
| `APP_URL` | Public URL of the admin UI (HTTPS for real domains) | Your NPM domain, e.g. `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Database password | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Session signing secret (**min. 32 characters** in production) | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | AES key for SSH credentials (32 decoded bytes) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Docker network name shared with NPM | `docker network ls` |

## GHCR deployment (optional)

Compose and Portainer stack default to `ghcr.io/finenumbers/ufw-remote-manager:latest`. Each GitHub release updates the `latest` tag.

| Variable | Description | Default |
|----------|-------------|---------|
| `GHCR_OWNER` | GitHub owner (lowercase) | `finenumbers` |
| `GHCR_IMAGE_TAG` | Image tag (`latest` or pin e.g. `v0.6.1`) | `latest` |

Legacy `GHCR_APP_IMAGE` / `GHCR_MIGRATE_IMAGE` / `IMAGE_TAG` are no longer required — image URLs are built from owner + tag in compose files.

## Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `SSH_ALLOWED_CIDRS` | Comma-separated CIDRs allowed as SSH targets | Empty (private IPs blocked) |
| `TRUST_PROXY` | Set to `1` when the app runs behind Nginx Proxy Manager so setup rate limits use `X-Forwarded-For` | Unset (forwarded headers ignored) |
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

In-memory rate-limit buckets are evicted when empty (single-replica deployment only — see [Architecture](../architecture.md)).

## APP_URL vs internal HTTP

Two different URLs serve different roles:

| Setting | Example | Purpose |
|---------|---------|---------|
| **`APP_URL`** | `https://ufw.example.com` | Public URL for Better Auth, cookies, and browser redirects |
| **NPM Proxy Host scheme** | `http` → `ufw-app:8088` | Internal Docker traffic; NPM terminates TLS |

Do **not** set `APP_URL` to the internal container URL. Better Auth requires the public HTTPS domain users type in the browser.

In production, `APP_URL` must use **HTTPS** for real hostnames. The only exceptions are `http://localhost` and `http://127.0.0.1` (local smoke tests and CI).

## Production behind NPM

When `ufw-app` sits behind Nginx Proxy Manager on a shared Docker network:

1. Set `TRUST_PROXY=1` in the app environment so `/setup` rate limits use the client IP from `X-Forwarded-For` (NPM sets this header).
2. Without `TRUST_PROXY`, setup limits use a single shared bucket (`direct`) — acceptable for local dev, not ideal for production.

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
