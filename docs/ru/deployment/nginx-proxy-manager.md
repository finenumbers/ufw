# Nginx Proxy Manager

Nginx Proxy Manager (NPM) must **already be installed** on your Docker host. This project does not deploy NPM.

## Traffic flow

```
Internet → NPM:443 (TLS) → ufw-app:8088 (HTTP, Docker network)
```

NPM terminates HTTPS. The app sets HSTS in production but relies on NPM for certificates.

## Proxy Host checklist

| Field | Value |
|-------|-------|
| Domain Names | Host from `APP_URL` (e.g. `ufw.example.com`) |
| Scheme | `http` |
| Forward Hostname / IP | `ufw-app` |
| Forward Port | `8088` |
| Websockets Support | **Enabled** |
| Block Common Exploits | Recommended |
| SSL | Let's Encrypt or existing certificate |
| Force SSL | Recommended |

## Docker network

App container must join the **same Docker network** as NPM.

```bash
NPM_NETWORK=nginxproxymanager_default
```

`docker-compose.prod.yml` attaches `ufw-app` to external network from `$NPM_NETWORK`.

```bash
docker network ls | grep -i proxy
```

## APP_URL must match

```bash
APP_URL=https://ufw.example.com
```

Must match NPM Proxy Host domain exactly (scheme + host). Better Auth cookies depend on this.

## Internal HTTP is intentional

NPM terminates TLS. Traffic NPM → `ufw-app:8088` is unencrypted HTTP on the Docker network — **by design**, not misconfiguration.

Do **not** set `APP_URL` to `http://ufw-app:8088`.

## TRUST_PROXY

Set in app environment when behind NPM:

```env
TRUST_PROXY=1
```

Ensures setup rate limits use real client IP from `X-Forwarded-For`.

## Local build alternative

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Same NPM checklist applies.

## Связанные документы

- [Переменные окружения](../administration/environment-variables.md)
- [GHCR + Compose](./ghcr-compose.md)
