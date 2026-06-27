# GHCR + Docker Compose

Produktions-Images werden in der **GitHub Container Registry (GHCR)** veröffentlicht:

| Image | Zweck |
|-------|-------|
| `ghcr.io/finenumbers/ufw-remote-manager:TAG` | Next.js-App |
| `ghcr.io/finenumbers/ufw-remote-manager-migrate:TAG` | Prisma-Migrationen (Einmal-Lauf) |

Jede Release veröffentlicht **`latest`** plus Versions-Tags (z. B. `v0.6.1`, `0.6.1`). Produktions-Deploys nutzen standardmäßig **`latest`** — keine Version in `.env` erforderlich.

Ersetzen Sie `finenumbers` durch Ihren Fork-Owner bei Verwendung eines Forks (`GHCR_OWNER` in `.env`).

## Universelle Images — APP_URL zur Laufzeit

Images sind **domänenunabhängig**. Setzen Sie `APP_URL` in `.env` auf Ihre öffentliche HTTPS-URL. Kein Build pro Domain erforderlich.

## Images beziehen

### Option A — Git-Tag-Release (empfohlen)

```bash
git tag v0.7.3
git push origin v0.7.3
```

GitHub Actions veröffentlicht getaggte Images und aktualisiert `latest`. Pakete müssen beim ersten Gebrauch **Public** sein (GitHub → Packages → Einstellungen).

### Option B — Release (dispatch)

Actions → **Release (dispatch)** → `image_tag` eingeben (benutzerdefinierter Tag; aktualisiert `latest` nicht, es sei denn, Sie taggen `latest` manuell).

## `.env` auf dem Server vorbereiten

```bash
cp .env.production.example .env
# or
./scripts/generate-production-env.sh .env
```

Beispiel (Geheimnisse erforderlich; Image-Variablen optional):

```bash
APP_URL=https://ufw.example.com
NPM_NETWORK=nginxproxymanager_default
POSTGRES_PASSWORD=...
BETTER_AUTH_SECRET=...
APP_ENCRYPTION_KEY=...
# Optional: GHCR_OWNER=finenumbers  GHCR_IMAGE_TAG=latest
```

Geheimnisse generieren:

```bash
openssl rand -base64 32   # BETTER_AUTH_SECRET, APP_ENCRYPTION_KEY
openssl rand -base64 24   # POSTGRES_PASSWORD
```

## Bereitstellen

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

Validieren:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env config
```

NPM konfigurieren — siehe [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Upgrade

Neu bereitstellen mit `docker compose ... pull && up -d` — keine `.env`-Änderungen bei Verwendung von `latest`.

Siehe [Upgrade und Rollback](../operations/upgrade-rollback.md) zum Pinnen einer Version.

## Fehlerbehebung

| Symptom | Prüfen |
|---------|--------|
| Auth-Redirect-Schleifen | `APP_URL` entspricht exakt der öffentlichen NPM-URL |
| `pull access denied` | Paketsichtbarkeit Public oder `docker login ghcr.io` |
| `APP_URL is required` | `.env` mit `--env-file .env` geladen |
| NPM 502 | App im Netzwerk `npm_proxy`; Container-Name `ufw-app` |

## Verwandte Dokumentation

- [Bereitstellungsübersicht](./overview.md)
- [Smoke-Tests](../operations/smoke-tests.md)
