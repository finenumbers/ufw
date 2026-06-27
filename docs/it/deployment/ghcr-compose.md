# GHCR + Docker Compose

Le immagini di produzione sono pubblicate su **GitHub Container Registry (GHCR)**:

| Immagine | Scopo |
|----------|-------|
| `ghcr.io/finenumbers/ufw-remote-manager:TAG` | App Next.js |
| `ghcr.io/finenumbers/ufw-remote-manager-migrate:TAG` | Migrazioni Prisma (esecuzione singola) |

Ogni release pubblica **`latest`** più tag di versione (es. `v0.8.0`, `0.6.1`). I deploy di produzione usano **`latest`** per impostazione predefinita — nessuna versione richiesta in `.env`.

Sostituire `finenumbers` con il proprietario del fork se si usa un fork (`GHCR_OWNER` in `.env`).

## Immagini universali — APP_URL a runtime

Le immagini sono **agnostiche al dominio**. Impostare `APP_URL` in `.env` sull'URL HTTPS pubblico. Nessun build per dominio richiesto.

## Ottenere le immagini

### Opzione A — Release tag Git (consigliato)

```bash
git tag v0.8.0
git push origin v0.8.0
```

GitHub Actions pubblica immagini taggate e aggiorna `latest`. I pacchetti devono essere **Public** al primo utilizzo (GitHub → Packages → impostazioni).

### Opzione B — Release (dispatch)

Actions → **Release (dispatch)** → inserire `image_tag` (tag personalizzato; non aggiorna `latest` salvo tag manuale di `latest`).

## Preparare `.env` sul server

```bash
cp .env.production.example .env
# or
./scripts/generate-production-env.sh .env
```

Esempio (segreti richiesti; variabili immagine opzionali):

```bash
APP_URL=https://ufw.example.com
NPM_NETWORK=nginxproxymanager_default
POSTGRES_PASSWORD=...
BETTER_AUTH_SECRET=...
APP_ENCRYPTION_KEY=...
# Optional: GHCR_OWNER=finenumbers  GHCR_IMAGE_TAG=latest
```

Generare segreti:

```bash
openssl rand -base64 32   # BETTER_AUTH_SECRET, APP_ENCRYPTION_KEY
openssl rand -base64 24   # POSTGRES_PASSWORD
```

## Distribuire

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

Validare:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env config
```

Configurare NPM — vedere [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Aggiornamento

Ridistribuire con `docker compose ... pull && up -d` — nessuna modifica `.env` usando `latest`.

Vedere [Aggiornamento e rollback](../operations/upgrade-rollback.md) per fissare una versione.

## Risoluzione problemi

| Sintomo | Verificare |
|---------|------------|
| Loop redirect auth | `APP_URL` corrisponde esattamente all'URL pubblico NPM |
| `pull access denied` | Visibilità pacchetto Public, o `docker login ghcr.io` |
| `APP_URL is required` | `.env` caricato con `--env-file .env` |
| NPM 502 | App sulla rete `npm_proxy`; nome container `ufw-app` |

## Documentazione correlata

- [Panoramica distribuzione](./overview.md)
- [Smoke test](../operations/smoke-tests.md)
