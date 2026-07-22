# Panoramica deployment

Scegliete come eseguire UFW Remote Manager in produzione. Tutti i percorsi usano Docker; PostgreSQL è obbligatorio.

## Percorso consigliato

**Immagini precompilate GHCR + overlay Compose + Nginx Proxy Manager**

```bash
./scripts/generate-production-env.sh .env
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

Vedi [GHCR + Compose](./ghcr-compose.md) e [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Metodi di deployment

| Metodo | Quando usarlo | Build sul server? |
|--------|-------------|------------------|
| **GHCR + Compose** | Produzione predefinita | No — `docker compose pull` |
| **Compose build locale** | Air-gapped o fork development | Sì — `docker compose build` |
| **Stack Portainer** | Ops guidate da GUI | Opzionale — usa GHCR o build |

## Livelli file Compose

| File | Scopo |
|------|---------|
| `docker-compose.yml` | Base: postgres, migrate, app |
| `docker-compose.prod.yml` | Produzione: nessuna porta pubblicata, rete NPM, env prod |
| `docker-compose.ghcr.yml` | Pull immagini da GHCR invece di build locale |

Combinateli con flag `-f`. Passate sempre `--env-file .env` in produzione.

## Container migrazione

A ogni `up`, **ufw-migrate** esegue `prisma migrate deploy` una volta ed esce. **Non** eseguite `prisma migrate` manualmente dentro **ufw-app** — usate il servizio migrate:

```bash
docker compose run --rm migrate
```

v0.9.2 **non ha nuova migrazione** oltre alle release precedenti — l'aggiornamento è pull e up.

## Funzionalità opzionali al deploy

| Funzionalità | Abilitazione |
|---------|--------|
| Scansione porte | `PORT_SCAN_ENABLED=true` — vedi [Scansione porte esterna](./port-scan.md) |
| Target SSH privati | `SSH_ALLOWED_CIDRS=10.0.0.0/8,...` |

Il monitor container Docker è stato **rimosso in v0.9.0** — nessun flag env.

## Pin versione

| Strategia | Impostazione |
|----------|---------|
| Seguire ultima release | `GHCR_IMAGE_TAG=latest` (predefinito) |
| Pin versione | `GHCR_IMAGE_TAG=v0.9.2` |

## Documenti correlati

- [GHCR + Compose](./ghcr-compose.md)
- [Portainer](./portainer.md)
- [Variabili d'ambiente](../administration/environment-variables.md)
- [Aggiornamento e rollback](../operations/upgrade-rollback.md)
