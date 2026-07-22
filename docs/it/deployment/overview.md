# Panoramica distribuzione

Scegliere come eseguire UFW Remote Manager in produzione. Tutti i percorsi presuppongono **HTTPS** tramite un proxy inverso esistente (Nginx Proxy Manager consigliato).

![Flusso distribuzione](../../assets/deploy-flow.svg)

## Confronto

| Metodo | Ideale per | Costruire immagini? |
|--------|------------|---------------------|
| [GHCR + Compose](./ghcr-compose.md) | La maggior parte dei self-hoster | No — pull da GitHub Packages |
| [Portainer](./portainer.md) | Gestione stack via GUI | No — pull immagini GHCR |
| Build Compose locale | Sviluppo air-gapped o fork | Sì — `docker compose build` |

Nginx Proxy Manager è **sempre esterno** — non incluso in questo repository.

## Servizi dello stack

| Container | Scopo |
|-----------|-------|
| `ufw-postgres` | Database |
| `ufw-migrate` | Esegue migrazioni DB una volta per deploy |
| `ufw-app` | Applicazione web (include Naabu/Nmap quando la scansione porte è abilitata) |

## Percorso produzione consigliato

1. Pull del tag immagine **`latest`** (o fissare es. `v0.6.1`) da GHCR
2. Generare `.env` sul server: `./scripts/generate-production-env.sh .env`
3. Distribuire con Compose + `docker-compose.prod.yml` + `docker-compose.ghcr.yml`
4. Configurare NPM Proxy Host → `ufw-app:8088`
5. Aprire `APP_URL/setup`, creare admin
6. Eseguire `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`
7. Opzionale: abilitare [scansione porte esterna](./port-scan.md) con `PORT_SCAN_ENABLED=true`

## Immagini universali

Impostare `APP_URL` in `.env` al deploy. La stessa immagine GHCR funziona per qualsiasi dominio — nessun build immagine per cliente.

## Disciplina segreti

- Generare segreti solo sul server
- Modalità file `600` per `.env`
- Non memorizzare mai segreti nel repo git dello stack Portainer o in ticket pubblici

## Documentazione correlata

- [Nginx Proxy Manager](./nginx-proxy-manager.md)
- [Variabili d'ambiente](../administration/environment-variables.md)
- [Smoke test](../operations/smoke-tests.md)
