# Nginx Proxy Manager

Nginx Proxy Manager (NPM) muss auf Ihrem Docker-Host **bereits installiert** sein. Dieses Projekt deployt NPM nicht.

## Traffic-Flow

```
Internet → NPM:443 (TLS) → ufw-app:8088 (HTTP, Docker-Netzwerk)
```

NPM terminiert HTTPS. Die App setzt HSTS in Produktion, verlässt sich aber auf NPM für Zertifikate.

## Proxy-Host-Checkliste

| Feld | Wert |
|------|------|
| Domain Names | Host aus `APP_URL` (z. B. `ufw.example.com`) |
| Scheme | `http` |
| Forward Hostname / IP | `ufw-app` |
| Forward Port | `8088` |
| Websockets Support | **Enabled** |
| Block Common Exploits | Empfohlen |
| SSL | Let's Encrypt oder vorhandenes Zertifikat |
| Force SSL | Empfohlen |

## Docker-Netzwerk

App-Container muss im **selben Docker-Netzwerk** wie NPM sein.

```bash
NPM_NETWORK=nginxproxymanager_default
```

`docker-compose.prod.yml` hängt `ufw-app` an externes Netzwerk von `$NPM_NETWORK`.

```bash
docker network ls | grep -i proxy
```

## APP_URL muss übereinstimmen

```bash
APP_URL=https://ufw.example.com
```

Muss NPM-Proxy-Host-Domain exakt entsprechen (Scheme + Host). Better-Auth-Cookies hängen davon ab.

## Internes HTTP ist beabsichtigt

NPM terminiert TLS. Traffic NPM → `ufw-app:8088` ist unverschlüsseltes HTTP im Docker-Netzwerk — **beabsichtigt**, keine Fehlkonfiguration.

`APP_URL` **nicht** auf `http://ufw-app:8088` setzen.

## TRUST_PROXY

In App-Umgebung setzen, wenn hinter NPM:

```env
TRUST_PROXY=1
```

Stellt sicher, dass Setup-Ratenlimits echte Client-IP aus `X-Forwarded-For` nutzen.

## Lokale Build-Alternative

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Gleiche NPM-Checkliste gilt.

## Verwandte Dokumentation

- [Umgebungsvariablen](../administration/environment-variables.md)
- [GHCR + Compose](./ghcr-compose.md)
