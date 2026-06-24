# Portainer-Bereitstellung

Bereitstellung mit **Portainer** unter Verwendung vorgefertigter **GHCR**-Images hinter bestehendem **Nginx Proxy Manager**.

NPM ist nicht in diesem Stack enthalten.

## Voraussetzungen

- Docker-Host mit Portainer und NPM
- GHCR-Images aus [Releases](https://github.com/finenumbers/ufw/releases)
- NPM-Docker-Netzwerkname (z. B. `nginxproxymanager_default`)

NPM-Netzwerk finden:

```bash
docker network ls | grep -i proxy
docker inspect <npm_container> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

## Umgebungsvariablen vorbereiten

```bash
./scripts/generate-production-env.sh .env
```

Oder [`.env.production.example`](../../../.env.production.example) kopieren.

Erforderlich: `APP_URL`, `NPM_NETWORK`, `GHCR_APP_IMAGE`, `GHCR_MIGRATE_IMAGE`, `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `APP_ENCRYPTION_KEY`.

## Stack anlegen

### Web-Editor

1. Portainer → **Stacks** → **Add stack**
2. Name: `ufw-remote-manager`
3. [`deploy/portainer.stack.yml`](../../../deploy/portainer.stack.yml) einfügen
4. Environment variables → **Advanced mode** → `.env`-Inhalt einfügen
5. **Deploy the stack**

### Git-Repository

1. Repository-URL: `https://github.com/finenumbers/ufw`
2. Compose-Pfad: `deploy/portainer.stack.yml`
3. Umgebung in der Portainer-Oberfläche setzen (Geheimnisse niemals in Git committen)

## NPM konfigurieren

Siehe [Nginx Proxy Manager](./nginx-proxy-manager.md) — Weiterleitung an `ufw-app:3000`.

## Verifizieren

1. Stack-Container healthy; `ufw-migrate` exited 0
2. Browser → `APP_URL/setup` oder `/login`
3. `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

## Upgrade und Backup

- [Upgrade und Rollback](../operations/upgrade-rollback.md)
- [Backup und Wiederherstellung](../operations/backup-restore.md)

## Verwandte Dokumentation

- [GHCR + Compose](./ghcr-compose.md)
- [Sicherheitsmodell](../administration/security-model.md)
