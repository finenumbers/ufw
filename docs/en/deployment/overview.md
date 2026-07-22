# Deployment overview

Choose how to run UFW Remote Manager in production. All paths use Docker; PostgreSQL is required.

## Recommended path

**GHCR pre-built images + Compose overlays + Nginx Proxy Manager**

```bash
./scripts/generate-production-env.sh .env
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

See [GHCR + Compose](./ghcr-compose.md) and [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Deployment methods

| Method | When to use | Build on server? |
|--------|-------------|------------------|
| **GHCR + Compose** | Default production | No — `docker compose pull` |
| **Local Compose build** | Air-gapped or fork development | Yes — `docker compose build` |
| **Portainer stack** | GUI-driven ops | Optional — uses GHCR or build |

## Compose file layers

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Base: postgres, migrate, app |
| `docker-compose.prod.yml` | Production: no published ports, NPM network, prod env |
| `docker-compose.ghcr.yml` | Pull images from GHCR instead of local build |

Combine with `-f` flags. Always pass `--env-file .env` in production.

## Migration container

On each `up`, **ufw-migrate** runs `prisma migrate deploy` once and exits. Do **not** run `prisma migrate` manually inside **ufw-app** — use the migrate service:

```bash
docker compose run --rm migrate
```

v0.9.2 has **no new migration** beyond prior releases — upgrade is pull and up.

## Optional features at deploy time

| Feature | Enable |
|---------|--------|
| Port scan | `PORT_SCAN_ENABLED=true` — see [External port scanning](./port-scan.md) |
| Private SSH targets | `SSH_ALLOWED_CIDRS=10.0.0.0/8,...` |

Legacy remote container inventory was **removed in v0.9.0** — no env flag.

## Version pinning

| Strategy | Setting |
|----------|---------|
| Track latest release | `GHCR_IMAGE_TAG=latest` (default) |
| Pin version | `GHCR_IMAGE_TAG=v0.9.2` |

## Related docs

- [GHCR + Compose](./ghcr-compose.md)
- [Portainer](./portainer.md)
- [Environment variables](../administration/environment-variables.md)
- [Upgrade and rollback](../operations/upgrade-rollback.md)
