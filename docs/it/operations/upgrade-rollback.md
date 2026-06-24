# Aggiornamento e rollback

Stack: `ufw-postgres`, `ufw-migrate` (one-shot), `ufw-app`. Le immagini sono universali — imposta `APP_URL` in `.env` a runtime.

## Prima di ogni aggiornamento

1. [Backup](./backup-restore.md) Postgres e `.env`
2. Registra tag immagine corrente: `grep IMAGE_TAG .env`
3. Leggi [note di release](https://github.com/finenumbers/ufw/releases)

## Aggiornamento (GHCR + Compose)

1. Aggiorna `.env`:

```bash
IMAGE_TAG=v0.2.0
GHCR_APP_IMAGE=ghcr.io/finenumbers/ufw-remote-manager:v0.2.0
GHCR_MIGRATE_IMAGE=ghcr.io/finenumbers/ufw-remote-manager-migrate:v0.2.0
```

2. Pull e redeploy:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

3. Verifica: `docker logs ufw-migrate` (exit 0) e `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

Le migrazioni vengono eseguite automaticamente tramite `ufw-migrate`.

## Aggiornamento (Portainer)

Aggiorna `GHCR_*_IMAGE` nell'environment dello stack → **Update the stack** (Pull & redeploy).

## Rollback

Le migrazioni Prisma sono forward-only. Se una nuova versione ha applicato modifiche schema irreversibili, **ripristina Postgres dal backup pre-aggiornamento** — non limitarti a ripristinare il tag immagine.

Rollback sicuro solo immagine (nessuna migrazione distruttiva):

1. Ripristina tag immagine in `.env` alla versione precedente
2. `docker compose ... pull && docker compose ... up -d`
3. Smoke test

## Cambiare APP_URL (spostamento dominio)

1. Aggiorna NPM Proxy Host
2. Cambia `APP_URL` in `.env`
3. `docker compose ... up -d app`

Nessuna ricompilazione immagine richiesta. Gli utenti potrebbero dover accedere di nuovo.

## Documentazione correlata

- [Backup e ripristino](./backup-restore.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
