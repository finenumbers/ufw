# GHCR + Docker Compose

Tirez des images préconstruites depuis GitHub Container Registry — recommandé pour la production.

## Prérequis

- Docker Compose v2
- `.env` depuis [`generate-production-env.sh`](../../../scripts/generate-production-env.sh)
- Nginx Proxy Manager sur réseau Docker partagé (`NPM_NETWORK`)

## Noms d'images

```
ghcr.io/finenumbers/ufw-remote-manager:${GHCR_IMAGE_TAG:-latest}
ghcr.io/finenumbers/ufw-remote-manager-migrate:${GHCR_IMAGE_TAG:-latest}
```

Chaque release GitHub met à jour le tag `latest`. Épingler `GHCR_IMAGE_TAG=v0.9.2` pour des versions fixes.

## Déployer

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

Valider la config rendue :

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env config
```

## Mise à niveau

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

Migrate s'exécute automatiquement. v0.9.0+ a supprimé les tables d'inventaire legacy — s'assurer que migrate se termine une fois lors de la mise à niveau depuis des versions plus anciennes.

Pas de modification `.env` requise en restant sur `latest`.

## Test de fumée

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

## Dépannage

| Erreur | Correction |
|--------|------------|
| `pull access denied` | Visibilité package Public, ou `docker login ghcr.io` |
| Échec migrate | Vérifier logs : `docker compose logs migrate` |
| Échec health check | `docker compose logs app` ; vérifier secrets et `APP_URL` |

## Documentation associée

- [Vue d'ensemble du déploiement](./overview.md)
- [Mise à niveau et retour arrière](../operations/upgrade-rollback.md)
