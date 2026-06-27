# Variabili d'ambiente

La configurazione di runtime è fornita tramite `.env` (Compose) o interfaccia variabili d'ambiente Portainer. **Non committare mai valori reali in git.**

## Obbligatorie (produzione)

| Variabile | Descrizione | Generazione |
|----------|-------------|----------|
| `APP_URL` | URL HTTPS pubblico dell'interfaccia admin | Il tuo dominio NPM, es. `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Password database | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Segreto firma sessione | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | Chiave AES per credenziali SSH (32 byte decodificati) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Nome rete Docker condivisa con NPM | `docker network ls` |

## Deployment GHCR (opzionale)

Compose e stack Portainer usano per default `ghcr.io/finenumbers/ufw-remote-manager:latest`. Ogni release GitHub aggiorna il tag `latest`.

| Variabile | Descrizione | Predefinito |
|-----------|-------------|-------------|
| `GHCR_OWNER` | Proprietario GitHub (minuscolo) | `finenumbers` |
| `GHCR_IMAGE_TAG` | Tag immagine (`latest` o es. `v0.2.1`) | `latest` |

## Opzionali

| Variabile | Descrizione | Predefinito |
|----------|-------------|---------|
| `SSH_ALLOWED_CIDRS` | CIDR separati da virgola consentiti come target SSH | Vuoto (IP privati bloccati) |
| `APP_BIND` | Indirizzo bind compose locale | `127.0.0.1` |
| `APP_PORT` | Porta host per compose locale | `8088` |
| `POSTGRES_PORT` | Porta host Postgres in dev | `5434` |
| `LOG_LEVEL` | Livello log Pino | `info` |

## Limiti di frequenza (fissi)

Le azioni ripetute sullo stesso server hanno un cooldown di **30 secondi** (non configurabile via variabili d'ambiente):

- Refresh stato UFW e sync regole
- Avvio port scan
- Refresh inventario Docker
- Start, stop e restart container Docker

Da **v0.5.1**, variabili legacy come `PORT_SCAN_RATE_LIMIT_WINDOW_MS`, `DOCKER_REFRESH_RATE_LIMIT_WINDOW_MS` e `DOCKER_CONTROL_RATE_LIMIT_WINDOW_MS` sono **ignorate** se ancora presenti in `.env`.

## Come le variabili raggiungono i container

In `docker-compose.yml`:

```yaml
APP_URL: ${APP_URL:-http://localhost:8088}
BETTER_AUTH_URL: ${APP_URL:-http://localhost:8088}
```

L'app legge `APP_URL` o `BETTER_AUTH_URL` a runtime (`getPublicAppUrl()`).

## Template e generatori

- [`.env.example`](../../../.env.example) — sviluppo locale
- [`.env.production.example`](../../../.env.production.example) — template produzione
- [`scripts/generate-production-env.sh`](../../../scripts/generate-production-env.sh) — generatore interattivo

## Documentazione correlata

- [Modello di sicurezza](./security-model.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
