# Panoramica deployment

Scegli come eseguire UFW Remote Manager in produzione. Tutti i percorsi presuppongono **HTTPS** tramite un reverse proxy esistente (Nginx Proxy Manager consigliato).

![Flusso deploy](../../assets/deploy-flow.svg)

## Confronto

| Metodo | Ideale per | Compilare immagini? |
|--------|----------|---------------|
| [GHCR + Compose](./ghcr-compose.md) | La maggior parte dei self-hoster | No — pull da GitHub Packages |
| [Portainer](./portainer.md) | Gestione stack GUI | No — pull immagini GHCR |
| Compose build locale | Ambiente air-gapped o fork in sviluppo | Sì — `docker compose build` |

Nginx Proxy Manager è **sempre esterno** — non incluso in questo repository.

## Servizi dello stack

| Container | Scopo |
|-----------|---------|
| `ufw-postgres` | Database |
| `ufw-migrate` | Esegue migrazioni DB una volta per deploy |
| `ufw-app` | Applicazione web |

## Percorso produzione consigliato

1. Pull tag immagine `v0.1.0` (o ultima release) da GHCR
2. Genera `.env` sul server: `./scripts/generate-production-env.sh .env`
3. Deploy con Compose + `docker-compose.prod.yml` + `docker-compose.ghcr.yml`
4. Configura NPM Proxy Host → `ufw-app:3000`
5. Apri `APP_URL/setup`, crea admin
6. Esegui `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

## Immagini universali

Imposta `APP_URL` in `.env` al momento del deploy. La stessa immagine GHCR funziona per qualsiasi dominio — nessuna build immagine per cliente.

## Disciplina segreti

- Genera segreti solo sul server
- Permessi file `600` per `.env`
- Non archiviare segreti nel repo git dello stack Portainer o in ticket pubblici

## Documentazione correlata

- [Nginx Proxy Manager](./nginx-proxy-manager.md)
- [Variabili d'ambiente](../administration/environment-variables.md)
- [Smoke test](../operations/smoke-tests.md)
