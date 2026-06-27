# Nginx Proxy Manager

Nginx Proxy Manager (NPM) must **already be installed** on your Docker host. This project does not deploy NPM.

## Traffic flow

```
Internet → NPM:443 (TLS) → ufw-app:8088 (HTTP, Docker network)
```

NPM terminates HTTPS. The app sets HSTS in production but relies on NPM for certificates.

## Proxy Host checklist

Create or update a **Proxy Host** in the NPM UI:

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

The app container must join the **same Docker network** as NPM.

Set in `.env`:

```bash
NPM_NETWORK=nginxproxymanager_default
```

(`docker-compose.prod.yml` attaches `ufw-app` to external network `npm_proxy` → `$NPM_NETWORK`.)

Find your network name:

```bash
docker network ls | grep -i proxy
```

## APP_URL must match

`APP_URL` in `.env` must exactly match the public URL (scheme + host):

```bash
APP_URL=https://ufw.example.com
```

Mismatch causes auth redirect loops or broken cookies.

## APP_URL vs Proxy Host scheme

| Layer | Scheme | Example |
|-------|--------|---------|
| Browser / `APP_URL` | **HTTPS** | `https://ufw.example.com` |
| NPM → container | **HTTP** | `http://ufw-app:8088` |

NPM terminates TLS. The app container listens on plain HTTP inside the Docker network — this is **by design**, not a misconfiguration.

Set `APP_URL` to the public HTTPS URL only. Never point `APP_URL` at `http://ufw-app:8088`.

## TRUST_PROXY

When running behind NPM, set in `.env` or Portainer stack environment:

```bash
TRUST_PROXY=1
```

This makes `/setup` rate limits use the real client IP from `X-Forwarded-For`. See [Environment variables](../administration/environment-variables.md).

## Local build (without GHCR)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Same NPM Proxy Host settings apply.

## Related docs

- [Deployment overview](./overview.md)
- [GHCR + Compose](./ghcr-compose.md)
- [Troubleshooting](../troubleshooting.md)
