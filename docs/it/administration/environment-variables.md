# Variabili d'ambiente

Configurazione di runtime via `.env` (Compose) o UI ambiente Portainer. **Non committate mai valori reali in git.**

## Obbligatorie (produzione)

| Variabile | Descrizione | Generazione |
|----------|-------------|----------|
| `APP_URL` | URL HTTPS pubblico dell'UI admin | Il vostro dominio NPM, es. `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Password database | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Firma sessione (**min. 32 caratteri** in produzione) | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | Chiave AES per credenziali SSH (32 byte decodificati) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Rete Docker condivisa con NPM | `docker network ls` |
| `TRUST_PROXY` | Impostare su `1` dietro NPM per limiti setup accurati | `1` |

## Deployment GHCR

Immagine predefinita: `ghcr.io/finenumbers/ufw-remote-manager:latest` (aggiornata a ogni release).

| Variabile | Descrizione | Predefinito |
|----------|-------------|---------|
| `GHCR_OWNER` | Proprietario GitHub (minuscolo) | `finenumbers` |
| `GHCR_IMAGE_TAG` | Tag (`latest` o pin es. `v0.9.2`) | `latest` |

Fissate `GHCR_IMAGE_TAG=v0.9.2` per deploy riproducibili; usate `latest` per aggiornamenti automatici al `pull`.

Legacy `GHCR_APP_IMAGE` / `GHCR_MIGRATE_IMAGE` / `IMAGE_TAG` non sono più usati.

## Scansione porte (opzionale)

| Variabile | Predefinito | Descrizione |
|----------|---------|-------------|
| `PORT_SCAN_ENABLED` | non impostato (disabilitato) | Impostare `true` per abilitare UI e pipeline |
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | Max porte inviate a enrichment Nmap |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `1800000` | Timeout discovery completa (30 min) |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Timeout enrichment (10 min) |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | Esecuzioni scan memorizzate per server |

Legacy `PORT_SCAN_RATE_LIMIT_WINDOW_MS` è **ignorato**. Le scansioni ripetute usano cooldown fisso di **30 secondi** nel codice app.

## SSH e proxy

| Variabile | Predefinito | Descrizione |
|----------|---------|-------------|
| `SSH_ALLOWED_CIDRS` | vuoto | CIDR separati da virgola consentiti come target SSH |
| `TRUST_PROXY` | non impostato | `1` = fidati di `X-Forwarded-For` per limite setup |

## Sviluppo locale

| Variabile | Predefinito | Descrizione |
|----------|---------|-------------|
| `APP_BIND` | `127.0.0.1` | Indirizzo bind Compose |
| `APP_PORT` | `8088` | Porta host |
| `POSTGRES_PORT` | `5434` | Porta Postgres host |
| `LOG_LEVEL` | `info` | Livello log Pino |

## Rimossi / ignorati (storico)

| Variabile | Stato |
|----------|--------|
| Variabili legacy inventario container (pre-v0.9.0) | Ignorate — funzione rimossa in v0.9.0 |
| `PORT_SCAN_RATE_LIMIT_WINDOW_MS` | Ignorato da v0.5.1 |

## Limiti di frequenza (fissi nel codice)

Cooldown 30 secondi per server: refresh/sync UFW, avvio scansione porte. Non configurabili via env.

Bucket in memoria — solo replica singola. Vedi [Architettura](../architecture.md).

## APP_URL vs HTTP interno

| Impostazione | Esempio | Scopo |
|---------|---------|---------|
| **`APP_URL`** | `https://ufw.example.com` | URL browser, cookie Better Auth |
| **NPM → app** | `http://ufw-app:8088` | Traffico Docker interno |

**Non** impostate `APP_URL` all'URL interno del container.

La produzione richiede **HTTPS** su `APP_URL` eccetto `localhost` / `127.0.0.1`.

## Come le variabili raggiungono i container

```yaml
APP_URL: ${APP_URL:-http://localhost:8088}
BETTER_AUTH_URL: ${APP_URL:-http://localhost:8088}
```

L'app legge `APP_URL` o `BETTER_AUTH_URL` via `getPublicAppUrl()`.

## Template

- [`.env.example`](../../../.env.example) — sviluppo locale
- [`.env.production.example`](../../../.env.production.example) — template produzione
- [`scripts/generate-production-env.sh`](../../../scripts/generate-production-env.sh) — generatore interattivo

## Documenti correlati

- [Modello di sicurezza](./security-model.md)
- [Scansione porte esterna](../deployment/port-scan.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
