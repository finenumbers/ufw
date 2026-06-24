# Nginx Proxy Manager

Nginx Proxy Manager (NPM) must **already be installed** on your Docker host. This project does not deploy NPM.

## Traffic flow

```
Internet → NPM:443 (TLS) → ufw-app:3000 (HTTP, Docker network)
```

NPM terminates HTTPS. The app sets HSTS in production but relies on NPM for certificates.

## Proxy Host checklist

Create or update a **Proxy Host** in the NPM UI:

| Field | Value |
|-------|-------|
| Domain Names | Host from `APP_URL` (e.g. `ufw.example.com`) |
| Scheme | `http` |
| Forward Hostname / IP | `ufw-app` |
| Forward Port | `3000` |
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

## Local build (without GHCR)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Same NPM Proxy Host settings apply.

## Related docs

- [Deployment overview](./overview.md)
- [GHCR + Compose](./ghcr-compose.md)
- [Troubleshooting](../troubleshooting.md)
