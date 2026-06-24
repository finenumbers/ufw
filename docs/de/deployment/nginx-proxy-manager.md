# Nginx Proxy Manager

Nginx Proxy Manager (NPM) muss auf Ihrem Docker-Host **bereits installiert** sein. Dieses Projekt stellt NPM nicht bereit.

## Datenfluss

```
Internet → NPM:443 (TLS) → ufw-app:8088 (HTTP, Docker network)
```

NPM terminiert HTTPS. Die App setzt HSTS in der Produktion, verlässt sich aber auf NPM für Zertifikate.

## Proxy-Host-Checkliste

Einen **Proxy Host** in der NPM-Oberfläche anlegen oder aktualisieren:

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

Der App-Container muss dem **selben Docker-Netzwerk** wie NPM beitreten.

In `.env` setzen:

```bash
NPM_NETWORK=nginxproxymanager_default
```

(`docker-compose.prod.yml` hängt `ufw-app` an externes Netzwerk `npm_proxy` → `$NPM_NETWORK`.)

Netzwerkname finden:

```bash
docker network ls | grep -i proxy
```

## APP_URL muss übereinstimmen

`APP_URL` in `.env` muss exakt mit der öffentlichen URL übereinstimmen (Schema + Host):

```bash
APP_URL=https://ufw.example.com
```

Abweichung verursacht Auth-Redirect-Schleifen oder defekte Cookies.

## Lokaler Build (ohne GHCR)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Dieselben NPM-Proxy-Host-Einstellungen gelten.

## Verwandte Dokumentation

- [Bereitstellungsübersicht](./overview.md)
- [GHCR + Compose](./ghcr-compose.md)
- [Fehlerbehebung](../troubleshooting.md)
