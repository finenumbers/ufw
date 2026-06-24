# GHCR + Docker Compose

Produktions-Images werden in der **GitHub Container Registry (GHCR)** veröffentlicht:

| Image | Zweck |
|-------|-------|
| `ghcr.io/finenumbers/ufw-remote-manager:TAG` | Next.js-App |
| `ghcr.io/finenumbers/ufw-remote-manager-migrate:TAG` | Prisma-Migrationen (Einmal) |

Ersetzen Sie `finenumbers` durch Ihren Fork-Owner, wenn Sie einen Fork nutzen.

## Universelle Images — APP_URL zur Laufzeit

Images sind **domainunabhängig**. Setzen Sie `APP_URL` in `.env` auf Ihre öffentliche HTTPS-URL. Kein Build pro Domain erforderlich.

## Images abrufen

### Option A — Git-Tag-Release (empfohlen)

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions veröffentlicht getaggte Images. Pakete müssen beim ersten Mal **Public** sein (GitHub → Packages → Einstellungen).

### Option B — Release (Dispatch)

Actions → **Release (dispatch)** → `image_tag` eingeben (z. B. `v0.1.0-prod`).

## `.env` auf dem Server vorbereiten

```bash
cp .env.production.example .env
# oder
./scripts/generate-production-env.sh .env
```

Beispiel:

```bash
APP_URL=https://ufw.example.com
NPM_NETWORK=nginxproxymanager_default
GHCR_OWNER=finenumbers
IMAGE_TAG=v0.1.0
GHCR_APP_IMAGE=ghcr.io/finenumbers/ufw-remote-manager:v0.1.0
GHCR_MIGRATE_IMAGE=ghcr.io/finenumbers/ufw-remote-manager-migrate:v0.1.0
POSTGRES_PASSWORD=...
BETTER_AUTH_SECRET=...
APP_ENCRYPTION_KEY=...
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

Siehe [Upgrade und Rollback](../operations/upgrade-rollback.md).

## Fehlerbehebung

| Symptom | Prüfen |
|---------|--------|
| Auth-Redirect-Schleifen | `APP_URL` stimmt exakt mit öffentlicher NPM-URL überein |
| `pull access denied` | Paketsichtbarkeit Public, oder `docker login ghcr.io` |
| `APP_URL is required` | `.env` mit `--env-file .env` geladen |
| NPM 502 | App im `npm_proxy`-Netzwerk; Container-Name `ufw-app` |

## Verwandte Dokumentation

- [Bereitstellungsübersicht](./overview.md)
- [Smoke-Tests](../operations/smoke-tests.md)
