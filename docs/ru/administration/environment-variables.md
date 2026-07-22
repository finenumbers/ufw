# Переменные окружения

Runtime configuration via `.env` (Compose) or Portainer environment UI. **Never commit real values to git.**

## Required (production)

| Variable | Description | Generate |
|----------|-------------|----------|
| `APP_URL` | Public HTTPS URL of admin UI | Your NPM domain, e.g. `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Database password | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Session signing (**min. 32 characters** in production) | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | AES key for SSH credentials (32 decoded bytes) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Docker network shared with NPM | `docker network ls` |
| `TRUST_PROXY` | Set to `1` behind NPM for accurate setup rate limits | `1` |

## GHCR deployment

Default image: `ghcr.io/finenumbers/ufw-remote-manager:latest` (updated each release).

| Variable | Description | Default |
|----------|-------------|---------|
| `GHCR_OWNER` | GitHub owner (lowercase) | `finenumbers` |
| `GHCR_IMAGE_TAG` | Tag (`latest` or pin e.g. `v0.9.2`) | `latest` |

Pin `GHCR_IMAGE_TAG=v0.9.2` for reproducible deploys; use `latest` for automatic updates on `pull`.

Legacy `GHCR_APP_IMAGE` / `GHCR_MIGRATE_IMAGE` / `IMAGE_TAG` are no longer used.

## Port scan (optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT_SCAN_ENABLED` | unset (disabled) | Set `true` to enable UI and pipeline |
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | Max ports sent to Nmap enrichment |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `1800000` | Full discovery timeout (30 min) |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Enrichment timeout (10 min) |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | Stored scan runs per server |

Legacy `PORT_SCAN_RATE_LIMIT_WINDOW_MS` is **ignored**. Repeat scans use fixed **30 second** cooldown in app code.

## SSH and proxy

| Variable | Default | Description |
|----------|---------|-------------|
| `SSH_ALLOWED_CIDRS` | empty | Comma-separated CIDRs allowed as SSH targets |
| `TRUST_PROXY` | unset | `1` = trust `X-Forwarded-For` for setup rate limit |

## Local development

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_BIND` | `127.0.0.1` | Compose bind address |
| `APP_PORT` | `8088` | Host port |
| `POSTGRES_PORT` | `5434` | Host Postgres port |
| `LOG_LEVEL` | `info` | Pino log level |

## Removed / ignored (historical)

| Variable | Status |
|----------|--------|
| Legacy container-inventory env flags (pre-v0.9.0) | Ignored — feature removed in v0.9.0 |
| `PORT_SCAN_RATE_LIMIT_WINDOW_MS` | Ignored since v0.5.1 |

## Rate limits (fixed in code)

30 second cooldown per server: UFW refresh/sync, port scan start. Not env-configurable.

In-memory buckets — single replica only. See [Архитектура](../architecture.md).

## APP_URL vs internal HTTP

| Setting | Example | Purpose |
|---------|---------|---------|
| **`APP_URL`** | `https://ufw.example.com` | Browser URL, Better Auth cookies |
| **NPM → app** | `http://ufw-app:8088` | Internal Docker traffic |

Do **not** set `APP_URL` to the internal container URL.

Production requires **HTTPS** on `APP_URL` except `localhost` / `127.0.0.1`.

## How variables reach containers

```yaml
APP_URL: ${APP_URL:-http://localhost:8088}
BETTER_AUTH_URL: ${APP_URL:-http://localhost:8088}
```

App reads `APP_URL` or `BETTER_AUTH_URL` via `getPublicAppUrl()`.

## Templates

- [`.env.example`](../../../.env.example) — local development
- [`.env.production.example`](../../../.env.production.example) — production template
- [`scripts/generate-production-env.sh`](../../../scripts/generate-production-env.sh) — interactive generator

## Связанные документы

- [Модель безопасности](./security-model.md)
- [Внешнее сканирование портов](../deployment/port-scan.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
