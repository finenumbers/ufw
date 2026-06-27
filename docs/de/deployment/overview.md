# Bereitstellungsübersicht

Wählen Sie, wie UFW Remote Manager in der Produktion betrieben wird. Alle Wege setzen **HTTPS** über einen bestehenden Reverse Proxy voraus (Nginx Proxy Manager empfohlen).

![Bereitstellungsablauf](../../assets/deploy-flow.svg)

## Vergleich

| Methode | Am besten für | Images bauen? |
|---------|---------------|---------------|
| [GHCR + Compose](./ghcr-compose.md) | Die meisten Self-Hoster | Nein — von GitHub Packages abrufen |
| [Portainer](./portainer.md) | GUI-Stack-Verwaltung | Nein — GHCR-Images abrufen |
| Lokaler Compose-Build | Air-gapped oder Fork-Entwicklung | Ja — `docker compose build` |

Nginx Proxy Manager ist **immer extern** — nicht in diesem Repository enthalten.

## Stack-Dienste

| Container | Zweck |
|-----------|-------|
| `ufw-postgres` | Datenbank |
| `ufw-migrate` | Führt DB-Migrationen einmal pro Deploy aus |
| `ufw-app` | Webanwendung (enthält Naabu/Nmap bei aktiviertem Port-Scan) |

## Empfohlener Produktionsweg

1. Image-Tag **`latest`** abrufen (oder z. B. `v0.6.1` pinnen) von GHCR
2. `.env` auf dem Server generieren: `./scripts/generate-production-env.sh .env`
3. Mit Compose + `docker-compose.prod.yml` + `docker-compose.ghcr.yml` bereitstellen
4. NPM Proxy Host konfigurieren → `ufw-app:8088`
5. `APP_URL/setup` öffnen, Admin anlegen
6. `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"` ausführen
7. Optional: [externen Port-Scan](./port-scan.md) mit `PORT_SCAN_ENABLED=true` aktivieren
8. Optional: [Docker-Container-Überwachung](./docker-monitor.md) mit `DOCKER_MONITOR_ENABLED=true` aktivieren

## Universelle Images

`APP_URL` in `.env` zum Deploy-Zeitpunkt setzen. Dasselbe GHCR-Image funktioniert für jede Domain — kein Image-Build pro Kunde.

## Geheimnis-Disziplin

- Geheimnisse nur auf dem Server generieren
- Dateimodus `600` für `.env`
- Geheimnisse niemals in Portainer-Stack-Git-Repo oder öffentlichen Tickets speichern

## Verwandte Dokumentation

- [Nginx Proxy Manager](./nginx-proxy-manager.md)
- [Umgebungsvariablen](../administration/environment-variables.md)
- [Smoke-Tests](../operations/smoke-tests.md)
