# Nginx Proxy Manager

Nginx Proxy Manager (NPM) deve essere **già installato** sul tuo host Docker. Questo progetto non deploya NPM.

## Flusso del traffico

```
Internet → NPM:443 (TLS) → ufw-app:8088 (HTTP, rete Docker)
```

NPM termina HTTPS. L'app imposta HSTS in produzione ma si affida a NPM per i certificati.

## Checklist Proxy Host

Crea o aggiorna un **Proxy Host** nell'interfaccia NPM:

| Campo | Valore |
|-------|-------|
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

Imposta in `.env`:

```bash
NPM_NETWORK=nginxproxymanager_default
```

(`docker-compose.prod.yml` collega `ufw-app` alla rete esterna `npm_proxy` → `$NPM_NETWORK`.)

Trova il nome della tua rete:

```bash
docker network ls | grep -i proxy
```

## APP_URL deve corrispondere

`APP_URL` in `.env` deve corrispondere esattamente all'URL pubblico (schema + host):

```bash
APP_URL=https://ufw.example.com
```

La mancata corrispondenza causa loop di redirect auth o cookie non funzionanti.

## Build locale (senza GHCR)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Si applicano le stesse impostazioni NPM Proxy Host.

## Documentazione correlata

- [Panoramica deployment](./overview.md)
- [GHCR + Compose](./ghcr-compose.md)
- [Risoluzione problemi](../troubleshooting.md)
