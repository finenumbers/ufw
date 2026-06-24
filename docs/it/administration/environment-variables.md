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

## Deployment GHCR

| Variabile | Descrizione |
|----------|-------------|
| `GHCR_APP_IMAGE` | es. `ghcr.io/finenumbers/ufw-remote-manager:v0.1.0` |
| `GHCR_MIGRATE_IMAGE` | es. `ghcr.io/finenumbers/ufw-remote-manager-migrate:v0.1.0` |
| `IMAGE_TAG` | Tag di riferimento in docs/script |
| `GHCR_OWNER` | Proprietario GitHub (minuscolo), es. `finenumbers` |

## Opzionali

| Variabile | Descrizione | Predefinito |
|----------|-------------|---------|
| `SSH_ALLOWED_CIDRS` | CIDR separati da virgola consentiti come target SSH | Vuoto (IP privati bloccati) |
| `APP_BIND` | Indirizzo bind compose locale | `127.0.0.1` |
| `APP_PORT` | Porta host per compose locale | `3000` |
| `POSTGRES_PORT` | Porta host Postgres in dev | `5434` |
| `LOG_LEVEL` | Livello log Pino | `info` |

## Come le variabili raggiungono i container

In `docker-compose.yml`:

```yaml
APP_URL: ${APP_URL:-http://localhost:3000}
BETTER_AUTH_URL: ${APP_URL:-http://localhost:3000}
```

L'app legge `APP_URL` o `BETTER_AUTH_URL` a runtime (`getPublicAppUrl()`).

## Template e generatori

- [`.env.example`](../../../.env.example) — sviluppo locale
- [`.env.production.example`](../../../.env.production.example) — template produzione
- [`scripts/generate-production-env.sh`](../../../scripts/generate-production-env.sh) — generatore interattivo

## Documentazione correlata

- [Modello di sicurezza](./security-model.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
