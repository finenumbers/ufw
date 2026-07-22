# GHCR + Docker Compose

Vorgefertigte Images von GitHub Container Registry ziehen — empfohlen für Produktion.

## Voraussetzungen

- Docker Compose v2
- `.env` von [`generate-production-env.sh`](../../../scripts/generate-production-env.sh)
- Nginx Proxy Manager im geteilten Docker-Netzwerk (`NPM_NETWORK`)

## Image-Namen

```
ghcr.io/finenumbers/ufw-remote-manager:${GHCR_IMAGE_TAG:-latest}
ghcr.io/finenumbers/ufw-remote-manager-migrate:${GHCR_IMAGE_TAG:-latest}
```

Jedes GitHub-Release aktualisiert den `latest`-Tag. `GHCR_IMAGE_TAG=v0.9.2` pinnen für feste Versionen.

## Deploy

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.ghcr.yml \
  --env-file .env \
  pull

docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.ghcr.yml \
  --env-file .env \
  up -d
```

Gerenderte Konfiguration validieren:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env config
```

## Upgrade

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

Migrate läuft automatisch. v0.9.0+ entfernte Legacy-Inventar-Tabellen — sicherstellen, dass Migrate einmal abgeschlossen ist beim Upgrade von älteren Versionen.

Keine `.env`-Änderungen erforderlich bei `latest`.

## Smoke-Test

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

## Fehlerbehebung

| Fehler | Lösung |
|--------|--------|
| `pull access denied` | Paket-Sichtbarkeit Public, oder `docker login ghcr.io` |
| Migrate schlägt fehl | Logs prüfen: `docker compose logs migrate` |
| Health-Check schlägt fehl | `docker compose logs app`; Secrets und `APP_URL` prüfen |

## Verwandte Dokumentation

- [Bereitstellungsübersicht](./overview.md)
- [Upgrade und Rollback](../operations/upgrade-rollback.md)
