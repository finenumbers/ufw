# Portainer-Bereitstellung

Bereitstellung mit **Portainer** unter Verwendung vorgefertigter **GHCR**-Images hinter vorhandenem **Nginx Proxy Manager**.

NPM ist nicht in diesem Stack enthalten.

## Voraussetzungen

- Docker-Host mit Portainer und laufendem NPM
- GHCR-Images von [Releases](https://github.com/finenumbers/ufw/releases) — Tag `latest` bei jedem Release aktualisiert; `GHCR_IMAGE_TAG=v0.9.2` pinnen falls nötig
- NPM-Docker-Netzwerkname (z. B. `nginxproxymanager_default`)

```bash
docker network ls | grep -i proxy
docker inspect <npm_container> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

## Umgebungsvariablen

```bash
./scripts/generate-production-env.sh .env
```

**Erforderlich:** `APP_URL`, `NPM_NETWORK`, `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `APP_ENCRYPTION_KEY`, `TRUST_PROXY=1`

**Optional:** `GHCR_OWNER`, `GHCR_IMAGE_TAG`, `PORT_SCAN_ENABLED=true`

## Stack erstellen

### Web-Editor

1. Portainer → **Stacks** → **Add stack**
2. Name: `ufw-remote-manager`
3. [`deploy/portainer.stack.yml`](../../../deploy/portainer.stack.yml) einfügen
4. Environment → **Advanced mode** → `.env`-Secrets einfügen
5. **Deploy the stack**

### Git-Repository

1. Repository: `https://github.com/finenumbers/ufw`
2. Compose-Pfad: `deploy/portainer.stack.yml`
3. Umgebung in Portainer-UI setzen — Secrets nie committen

## NPM konfigurieren

Proxy Host an `ufw-app:8088` weiterleiten — siehe [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Verifizieren

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

Bei Erstinstallation `APP_URL/setup` öffnen.

## Verwandte Dokumentation

- [GHCR + Compose](./ghcr-compose.md)
- [Bereitstellungsübersicht](./overview.md)
