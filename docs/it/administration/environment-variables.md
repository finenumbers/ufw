# Variabili d'ambiente

La configurazione di runtime è fornita tramite `.env` (Compose) o interfaccia variabili d'ambiente Portainer. **Non committare mai valori reali in git.**

## Obbligatorie (produzione)

| Variabile | Descrizione | Generazione |
|----------|-------------|----------|
| `APP_URL` | URL pubblico dell'interfaccia admin (HTTPS per domini reali) | Il tuo dominio NPM, es. `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Password database | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Segreto firma sessione (**min. 32 caratteri** in produzione) | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | Chiave AES per credenziali SSH (32 byte decodificati) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Nome rete Docker condivisa con NPM | `docker network ls` |

## Deployment GHCR (opzionale)

Compose e stack Portainer usano per default `ghcr.io/finenumbers/ufw-remote-manager:latest`. Ogni release GitHub aggiorna il tag `latest`.

| Variabile | Descrizione | Predefinito |
|-----------|-------------|-------------|
| `GHCR_OWNER` | Proprietario GitHub (minuscolo) | `finenumbers` |
| `GHCR_IMAGE_TAG` | Tag immagine (`latest` o pin es. `v0.2.1`) | `latest` |

Le variabili legacy `GHCR_APP_IMAGE` / `GHCR_MIGRATE_IMAGE` / `IMAGE_TAG` non sono più obbligatorie — gli URL delle immagini sono costruiti da owner + tag nei file compose.

## Opzionali

| Variabile | Descrizione | Predefinito |
|----------|-------------|---------|
| `SSH_ALLOWED_CIDRS` | CIDR separati da virgola consentiti come target SSH | Vuoto (IP privati bloccati) |
| `TRUST_PROXY` | Imposta a `1` quando l'app è dietro Nginx Proxy Manager così i limiti di frequenza di setup usano `X-Forwarded-For` | Non impostato (header inoltrati ignorati) |
| `APP_BIND` | Indirizzo bind compose locale | `127.0.0.1` |
| `APP_PORT` | Porta host per compose locale | `8088` |
| `POSTGRES_PORT` | Porta host Postgres in dev | `5434` |
| `LOG_LEVEL` | Livello log Pino | `info` |

## Limiti di frequenza (fissi)

Le server actions ripetute usano un cooldown di **30 secondi** per server (non configurabile tramite variabili d'ambiente):

- Refresh stato UFW e sync regole
- Avvio port scan
- Refresh inventario Docker
- Start, stop e restart container Docker

Da **v0.5.1**, variabili legacy come `PORT_SCAN_RATE_LIMIT_WINDOW_MS`, `DOCKER_REFRESH_RATE_LIMIT_WINDOW_MS` e `DOCKER_CONTROL_RATE_LIMIT_WINDOW_MS` sono **ignorate** se ancora presenti in `.env`.

I bucket dei limiti di frequenza in memoria vengono eliminati quando vuoti (solo deployment a replica singola — vedi [Architettura](../architecture.md)).

## APP_URL vs HTTP interno

Due URL diversi hanno ruoli diversi:

| Impostazione | Esempio | Scopo |
|---------|---------|---------|
| **`APP_URL`** | `https://ufw.example.com` | URL pubblico per Better Auth, cookie e redirect del browser |
| **Schema Proxy Host NPM** | `http` → `ufw-app:8088` | Traffico Docker interno; NPM termina TLS |

**Non** impostare `APP_URL` all'URL interno del container. Better Auth richiede il dominio HTTPS pubblico che gli utenti digitano nel browser.

In produzione, `APP_URL` deve usare **HTTPS** per hostname reali. Le uniche eccezioni sono `http://localhost` e `http://127.0.0.1` (smoke test locali e CI).

## Produzione dietro NPM

Quando `ufw-app` è dietro Nginx Proxy Manager su una rete Docker condivisa:

1. Imposta `TRUST_PROXY=1` nell'ambiente dell'app così i limiti di frequenza di `/setup` usano l'IP client da `X-Forwarded-For` (NPM imposta questo header).
2. Senza `TRUST_PROXY`, i limiti di setup usano un bucket condiviso singolo (`direct`) — accettabile per dev locale, non ideale per produzione.

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
