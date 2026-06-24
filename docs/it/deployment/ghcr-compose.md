# GHCR + Docker Compose

Le immagini di produzione sono pubblicate su **GitHub Container Registry (GHCR)**:

| Immagine | Scopo |
|-------|---------|
| `ghcr.io/finenumbers/ufw-remote-manager:TAG` | App Next.js |
| `ghcr.io/finenumbers/ufw-remote-manager-migrate:TAG` | Migrazioni Prisma (one-shot) |

Sostituisci `finenumbers` con il proprietario del tuo fork se usi un fork.

## Immagini universali — APP_URL a runtime

Le immagini sono **indipendenti dal dominio**. Imposta `APP_URL` in `.env` al tuo URL HTTPS pubblico. Nessuna build per dominio richiesta.

## Ottenere le immagini

### Opzione A — Release tag Git (consigliata)

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions pubblica immagini taggate. I pacchetti devono essere **Public** al primo uso (GitHub → Packages → settings).

### Opzione B — Release (dispatch)

Actions → **Release (dispatch)** → inserisci `image_tag` (es. `v0.1.0-prod`).

## Preparare `.env` sul server

```bash
cp .env.production.example .env
# oppure
./scripts/generate-production-env.sh .env
```

Esempio:

```bash
APP_URL=https://ufw.example.com
NPM_NETWORK=nginxproxymanager_default
GHCR_OWNER=finenumbers
IMAGE_TAG=v0.1.0
GHCR_APP_IMAGE=ghcr.io/finenumbers/ufw-remote-manager:v0.1.0
GHCR_MIGRATE_IMAGE=ghcr.io/finenumbers/ufw-remote-manager-migrate:v0.1.0
POSTGRES_PASSWORD=...
BETTER_AUTH_SECRET=...
APP_ENCRYPTION_KEY=...
```

Genera segreti:

```bash
openssl rand -base64 32   # BETTER_AUTH_SECRET, APP_ENCRYPTION_KEY
openssl rand -base64 24   # POSTGRES_PASSWORD
```

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

Valida:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env config
```

Configura NPM — vedi [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Aggiornamento

Vedi [Aggiornamento e rollback](../operations/upgrade-rollback.md).

## Risoluzione problemi

| Sintomo | Verifica |
|---------|-------|
| Loop redirect auth | `APP_URL` corrisponde esattamente all'URL pubblico NPM |
| `pull access denied` | Visibilità pacchetto Public, o `docker login ghcr.io` |
| `APP_URL is required` | `.env` caricato con `--env-file .env` |
| NPM 502 | App su rete `npm_proxy`; nome container `ufw-app` |

## Documentazione correlata

- [Panoramica deployment](./overview.md)
- [Smoke test](../operations/smoke-tests.md)
