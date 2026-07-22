# GHCR + Docker Compose

Pull di immagini precompilate da GitHub Container Registry — consigliato per la produzione.

## Prerequisiti

- Docker Compose v2
- `.env` da [`generate-production-env.sh`](../../../scripts/generate-production-env.sh)
- Nginx Proxy Manager su rete Docker condivisa (`NPM_NETWORK`)

## Nomi immagine

```
ghcr.io/finenumbers/ufw-remote-manager:${GHCR_IMAGE_TAG:-latest}
ghcr.io/finenumbers/ufw-remote-manager-migrate:${GHCR_IMAGE_TAG:-latest}
```

Ogni release GitHub aggiorna il tag `latest`. Fissate `GHCR_IMAGE_TAG=v0.9.2` per versioni fisse.

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

Validate la config renderizzata:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env config
```

## Aggiornamento

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

Migrate gira automaticamente. v0.9.0+ ha rimosso tabelle inventario legacy — assicuratevi che migrate completi una volta aggiornando da versioni più vecchie.

Nessuna modifica `.env` richiesta restando su `latest`.

## Smoke test

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

## Risoluzione problemi

| Errore | Soluzione |
|-------|-----|
| `pull access denied` | Visibilità package Public, oppure `docker login ghcr.io` |
| Migrate fallisce | Controllate log: `docker compose logs migrate` |
| Health check fallisce | `docker compose logs app`; verificate segreti e `APP_URL` |

## Documenti correlati

- [Panoramica deployment](./overview.md)
- [Aggiornamento e rollback](../operations/upgrade-rollback.md)
