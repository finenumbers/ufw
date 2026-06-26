# Deployment overview

Choose how to run UFW Remote Manager in production. All paths assume **HTTPS** via an existing reverse proxy (Nginx Proxy Manager recommended).

![Deploy flow](../../assets/deploy-flow.svg)

## Comparison

| Method | Best for | Build images? |
|--------|----------|---------------|
| [GHCR + Compose](./ghcr-compose.md) | Most self-hosters | No — pull from GitHub Packages |
| [Portainer](./portainer.md) | GUI stack management | No — pull GHCR images |
| Local Compose build | Air-gapped or fork development | Yes — `docker compose build` |

Nginx Proxy Manager is **always external** — not included in this repository.

## Stack services

| Container | Purpose |
|-----------|---------|
| `ufw-postgres` | Database |
| `ufw-migrate` | Runs DB migrations once per deploy |
| `ufw-app` | Web application (includes Naabu/Nmap when port scan enabled) |

## Recommended production path

1. Pull image tag `v0.1.0` (or latest release) from GHCR
2. Generate `.env` on server: `./scripts/generate-production-env.sh .env`
3. Deploy with Compose + `docker-compose.prod.yml` + `docker-compose.ghcr.yml`
4. Configure NPM Proxy Host → `ufw-app:8088`
5. Open `APP_URL/setup`, create admin
6. Run `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`
7. Optional: enable [external port scanning](./port-scan.md) with `PORT_SCAN_ENABLED=true`

## Universal images

Set `APP_URL` in `.env` at deploy time. The same GHCR image works for any domain — no per-customer image build.

## Secrets discipline

- Generate secrets on the server only
- File mode `600` for `.env`
- Never store secrets in Portainer stack git repo or public tickets

## Related docs

- [Nginx Proxy Manager](./nginx-proxy-manager.md)
- [Environment variables](../administration/environment-variables.md)
- [Smoke tests](../operations/smoke-tests.md)
