# Upgrade und Rollback

Stack: `ufw-postgres`, `ufw-migrate` (Einmal), `ufw-app`. Images sind universell — `APP_URL` in `.env` zur Laufzeit setzen.

## Vor jedem Upgrade

1. [Backup](./backup-restore.md) von Postgres und `.env`
2. Aktuellen Image-Tag notieren: `grep IMAGE_TAG .env`
3. [Release Notes](https://github.com/finenumbers/ufw/releases) lesen

## Upgrade (GHCR + Compose)

1. `.env` aktualisieren:

```bash
IMAGE_TAG=v0.2.0
GHCR_APP_IMAGE=ghcr.io/finenumbers/ufw-remote-manager:v0.2.0
GHCR_MIGRATE_IMAGE=ghcr.io/finenumbers/ufw-remote-manager-migrate:v0.2.0
```

2. Abrufen und neu bereitstellen:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

3. Verifizieren: `docker logs ufw-migrate` (exit 0) und `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

Migrationen laufen automatisch über `ufw-migrate`.

## Upgrade (Portainer)

`GHCR_*_IMAGE` in der Stack-Umgebung aktualisieren → **Update the stack** (Pull & redeploy).

## Rollback

Prisma-Migrationen sind nur vorwärts. Hat eine neue Version irreversible Schema-Änderungen angewendet, **Postgres aus Pre-Upgrade-Backup wiederherstellen** — nicht nur den Image-Tag zurücksetzen.

Sicheres Image-only-Rollback (keine destruktive Migration):

1. `.env`-Image-Tags auf vorherige Version zurücksetzen
2. `docker compose ... pull && docker compose ... up -d`
3. Smoke-Test

## APP_URL ändern (Domain-Umzug)

1. NPM Proxy Host aktualisieren
2. `APP_URL` in `.env` ändern
3. `docker compose ... up -d app`

Kein Image-Rebuild erforderlich. Benutzer müssen sich ggf. erneut anmelden.

## Verwandte Dokumentation

- [Backup und Wiederherstellung](./backup-restore.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
