# Nginx Proxy Manager

Nginx Proxy Manager (NPM) muss auf Ihrem Docker-Host **bereits installiert** sein. Dieses Projekt stellt NPM nicht bereit.

## Datenfluss

```
Internet → NPM:443 (TLS) → ufw-app:8088 (HTTP, Docker-Netzwerk)
```

NPM beendet HTTPS. Die App setzt HSTS in der Produktion, verlässt sich aber auf NPM für Zertifikate.

## Proxy-Host-Checkliste

Erstellen oder aktualisieren Sie einen **Proxy Host** in der NPM-UI:

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

(`docker-compose.prod.yml` verbindet `ufw-app` mit dem externen Netzwerk `npm_proxy` → `$NPM_NETWORK`.)

Netzwerkname ermitteln:

```bash
docker network ls | grep -i proxy
```

## APP_URL muss übereinstimmen

`APP_URL` in `.env` muss exakt der öffentlichen URL entsprechen (Schema + Host):

```bash
APP_URL=https://ufw.example.com
```

Abweichungen verursachen Auth-Redirect-Schleifen oder defekte Cookies.

## APP_URL vs. Proxy-Host-Schema

| Schicht | Schema | Beispiel |
|---------|--------|----------|
| Browser / `APP_URL` | **HTTPS** | `https://ufw.example.com` |
| NPM → Container | **HTTP** | `http://ufw-app:8088` |

NPM beendet TLS. Der App-Container lauscht im Docker-Netzwerk auf unverschlüsseltem HTTP — das ist **Absicht**, keine Fehlkonfiguration.

Setzen Sie `APP_URL` nur auf die öffentliche HTTPS-URL. Zeigen Sie `APP_URL` niemals auf `http://ufw-app:8088`.

## TRUST_PROXY

Bei Betrieb hinter NPM in `.env` oder Portainer-Stack-Umgebung setzen:

```bash
TRUST_PROXY=1
```

Damit verwenden Rate Limits auf `/setup` die echte Client-IP aus `X-Forwarded-For`. Siehe [Umgebungsvariablen](../administration/environment-variables.md).

## Lokaler Build (ohne GHCR)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Dieselben NPM-Proxy-Host-Einstellungen gelten.

## Verwandte Dokumentation

- [Bereitstellungsübersicht](./overview.md)
- [GHCR + Compose](./ghcr-compose.md)
- [Fehlerbehebung](../troubleshooting.md)
