# Bereitstellungsübersicht

Wählen Sie, wie UFW Remote Manager in Produktion läuft. Alle Pfade nutzen Docker; PostgreSQL ist erforderlich.

## Empfohlener Pfad

**GHCR vorgefertigte Images + Compose-Overlays + Nginx Proxy Manager**

```bash
./scripts/generate-production-env.sh .env
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

Siehe [GHCR + Compose](./ghcr-compose.md) und [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Bereitstellungsmethoden

| Methode | Wann verwenden | Build auf Server? |
|---------|----------------|-------------------|
| **GHCR + Compose** | Standard-Produktion | Nein — `docker compose pull` |
| **Lokaler Compose-Build** | Air-gapped oder Fork-Entwicklung | Ja — `docker compose build` |
| **Portainer-Stack** | GUI-gesteuerte Ops | Optional — GHCR oder Build |

## Compose-Datei-Schichten

| Datei | Zweck |
|-------|-------|
| `docker-compose.yml` | Basis: postgres, migrate, app |
| `docker-compose.prod.yml` | Produktion: keine veröffentlichten Ports, NPM-Netzwerk, Prod-Env |
| `docker-compose.ghcr.yml` | Images von GHCR ziehen statt lokalem Build |

Mit `-f`-Flags kombinieren. In Produktion immer `--env-file .env` übergeben.

## Migrate-Container

Bei jedem `up` führt **ufw-migrate** `prisma migrate deploy` einmal aus und beendet sich. **`prisma migrate` nicht manuell in ufw-app** ausführen — Migrate-Service verwenden:

```bash
docker compose run --rm migrate
```

v0.9.2 hat **keine neue Migration** über vorherige Releases hinaus — Upgrade ist pull und up.

## Optionale Features beim Deploy

| Feature | Aktivieren |
|---------|------------|
| Portscan | `PORT_SCAN_ENABLED=true` — siehe [Externer Portscan](./port-scan.md) |
| Private SSH-Ziele | `SSH_ALLOWED_CIDRS=10.0.0.0/8,...` |

Docker-Container-Monitor wurde **in v0.9.0 entfernt** — kein Env-Flag.

## Versions-Pinning

| Strategie | Einstellung |
|-----------|-------------|
| Neuestes Release verfolgen | `GHCR_IMAGE_TAG=latest` (Standard) |
| Version pinnen | `GHCR_IMAGE_TAG=v0.9.2` |

## Verwandte Dokumentation

- [GHCR + Compose](./ghcr-compose.md)
- [Portainer](./portainer.md)
- [Umgebungsvariablen](../administration/environment-variables.md)
- [Upgrade und Rollback](../operations/upgrade-rollback.md)
