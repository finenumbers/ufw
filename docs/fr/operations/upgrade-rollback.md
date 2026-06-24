# Mise à niveau et retour arrière

Stack : `ufw-postgres`, `ufw-migrate` (one-shot), `ufw-app`. Les images sont universelles — définissez `APP_URL` dans `.env` à l'exécution.

## Avant chaque mise à niveau

1. [Sauvegarder](./backup-restore.md) Postgres et `.env`
2. Noter le tag d'image actuel : `grep IMAGE_TAG .env`
3. Lire les [notes de release](https://github.com/finenumbers/ufw/releases)

## Mise à niveau (GHCR + Compose)

1. Mettre à jour `.env` :

```bash
IMAGE_TAG=v0.2.0
GHCR_APP_IMAGE=ghcr.io/finenumbers/ufw-remote-manager:v0.2.0
GHCR_MIGRATE_IMAGE=ghcr.io/finenumbers/ufw-remote-manager-migrate:v0.2.0
```

2. Tirer et redéployer :

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

3. Vérifier : `docker logs ufw-migrate` (exit 0) et `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

Les migrations s'exécutent automatiquement via `ufw-migrate`.

## Mise à niveau (Portainer)

Mettre à jour `GHCR_*_IMAGE` dans l'environnement de la stack → **Update the stack** (Pull & redeploy).

## Retour arrière

Les migrations Prisma sont unidirectionnelles. Si une nouvelle version a appliqué des changements de schéma irréversibles, **restaurez Postgres depuis la sauvegarde pré-mise à niveau** — ne revertissez pas uniquement le tag d'image.

Retour arrière image seule sûr (sans migration destructive) :

1. Revenir aux tags d'image précédents dans `.env`
2. `docker compose ... pull && docker compose ... up -d`
3. Test de fumée

## Changer APP_URL (changement de domaine)

1. Mettre à jour NPM Proxy Host
2. Modifier `APP_URL` dans `.env`
3. `docker compose ... up -d app`

Aucun rebuild d'image requis. Les utilisateurs devront peut-être se reconnecter.

## Documentation associée

- [Sauvegarde et restauration](./backup-restore.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
