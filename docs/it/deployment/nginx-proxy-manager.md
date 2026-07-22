# Nginx Proxy Manager

Nginx Proxy Manager (NPM) deve essere **già installato** sul vostro host Docker. Questo progetto non deploya NPM.

## Flusso traffico

```
Internet → NPM:443 (TLS) → ufw-app:8088 (HTTP, rete Docker)
```

NPM termina HTTPS. L'app imposta HSTS in produzione ma si affida a NPM per i certificati.

## Checklist Proxy Host

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

Il container app deve unirsi alla **stessa rete Docker** di NPM.

```bash
NPM_NETWORK=nginxproxymanager_default
```

`docker-compose.prod.yml` collega `ufw-app` alla rete esterna da `$NPM_NETWORK`.

```bash
docker network ls | grep -i proxy
```

## APP_URL deve corrispondere

```bash
APP_URL=https://ufw.example.com
```

Deve corrispondere esattamente al dominio Proxy Host NPM (schema + host). I cookie Better Auth dipendono da questo.

## HTTP interno è intenzionale

NPM termina TLS. Il traffico NPM → `ufw-app:8088` è HTTP non crittografato sulla rete Docker — **by design**, non misconfigurazione.

**Non** impostate `APP_URL` su `http://ufw-app:8088`.

## TRUST_PROXY

Impostate nell'ambiente app dietro NPM:

```env
TRUST_PROXY=1
```

Garantisce che i limiti setup usino l'IP client reale da `X-Forwarded-For`.

## Alternativa build locale

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Stessa checklist NPM si applica.

## Documenti correlati

- [Variabili d'ambiente](../administration/environment-variables.md)
- [GHCR + Compose](./ghcr-compose.md)
