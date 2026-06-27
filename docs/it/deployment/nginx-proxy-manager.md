# Nginx Proxy Manager

Nginx Proxy Manager (NPM) deve essere **già installato** sull'host Docker. Questo progetto non distribuisce NPM.

## Flusso del traffico

```
Internet → NPM:443 (TLS) → ufw-app:8088 (HTTP, rete Docker)
```

NPM termina HTTPS. L'app imposta HSTS in produzione ma si affida a NPM per i certificati.

## Checklist Proxy Host

Creare o aggiornare un **Proxy Host** nell'interfaccia NPM:

| Campo | Valore |
|-------|--------|
| Domain Names | Host da `APP_URL` (es. `ufw.example.com`) |
| Scheme | `http` |
| Forward Hostname / IP | `ufw-app` |
| Forward Port | `8088` |
| Websockets Support | **Enabled** |
| Block Common Exploits | Consigliato |
| SSL | Let's Encrypt o certificato esistente |
| Force SSL | Consigliato |

## Rete Docker

Il container dell'app deve unirsi alla **stessa rete Docker** di NPM.

Impostare in `.env`:

```bash
NPM_NETWORK=nginxproxymanager_default
```

(`docker-compose.prod.yml` collega `ufw-app` alla rete esterna `npm_proxy` → `$NPM_NETWORK`.)

Trovare il nome della rete:

```bash
docker network ls | grep -i proxy
```

## APP_URL deve corrispondere

`APP_URL` in `.env` deve corrispondere esattamente all'URL pubblico (schema + host):

```bash
APP_URL=https://ufw.example.com
```

Una discrepanza causa loop di redirect auth o cookie non validi.

## APP_URL vs schema Proxy Host

| Livello | Schema | Esempio |
|---------|--------|---------|
| Browser / `APP_URL` | **HTTPS** | `https://ufw.example.com` |
| NPM → container | **HTTP** | `http://ufw-app:8088` |

NPM termina TLS. Il container dell'app ascolta HTTP in chiaro nella rete Docker — è **intenzionale**, non una misconfigurazione.

Impostare `APP_URL` solo sull'URL HTTPS pubblico. Non puntare mai `APP_URL` a `http://ufw-app:8088`.

## TRUST_PROXY

In esecuzione dietro NPM, impostare in `.env` o ambiente stack Portainer:

```bash
TRUST_PROXY=1
```

Questo fa usare a `/setup` i rate limit con l'IP client reale da `X-Forwarded-For`. Vedere [Variabili d'ambiente](../administration/environment-variables.md).

## Build locale (senza GHCR)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Si applicano le stesse impostazioni NPM Proxy Host.

## Documentazione correlata

- [Panoramica distribuzione](./overview.md)
- [GHCR + Compose](./ghcr-compose.md)
- [Risoluzione problemi](../troubleshooting.md)
