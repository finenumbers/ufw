# GHCR + Docker Compose

Les images de production sont publiées sur **GitHub Container Registry (GHCR)** :

| Image | Rôle |
|-------|------|
| `ghcr.io/finenumbers/ufw-remote-manager:TAG` | Application Next.js |
| `ghcr.io/finenumbers/ufw-remote-manager-migrate:TAG` | Migrations Prisma (one-shot) |

Remplacez `finenumbers` par le propriétaire de votre fork si vous utilisez un fork.

## Images universelles — APP_URL à l'exécution

Les images sont **agnostiques du domaine**. Définissez `APP_URL` dans `.env` sur votre URL HTTPS publique. Aucun build par domaine requis.

## Obtenir les images

### Option A — Release par tag git (recommandé)

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions publie les images taguées. Les packages doivent être **Public** à la première utilisation (GitHub → Packages → paramètres).

### Option B — Release (dispatch)

Actions → **Release (dispatch)** → saisir `image_tag` (ex. `v0.1.0-prod`).

## Préparer `.env` sur le serveur

```bash
cp .env.production.example .env
# ou
./scripts/generate-production-env.sh .env
```

Exemple :

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

Générer les secrets :

```bash
openssl rand -base64 32   # BETTER_AUTH_SECRET, APP_ENCRYPTION_KEY
openssl rand -base64 24   # POSTGRES_PASSWORD
```

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

Valider :

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env config
```

Configurer NPM — voir [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Mise à niveau

Voir [Mise à niveau et retour arrière](../operations/upgrade-rollback.md).

## Dépannage

| Symptôme | Vérification |
|----------|--------------|
| Boucles de redirection auth | `APP_URL` correspond exactement à l'URL publique NPM |
| `pull access denied` | Visibilité du package Public, ou `docker login ghcr.io` |
| `APP_URL is required` | `.env` chargé avec `--env-file .env` |
| NPM 502 | Application sur le réseau `npm_proxy` ; nom de conteneur `ufw-app` |

## Documentation associée

- [Vue d'ensemble du déploiement](./overview.md)
- [Tests de fumée](../operations/smoke-tests.md)
