# GHCR + Docker Compose

Les images de production sont publiées sur **GitHub Container Registry (GHCR)** :

| Image | Rôle |
|-------|------|
| `ghcr.io/finenumbers/ufw-remote-manager:TAG` | Application Next.js |
| `ghcr.io/finenumbers/ufw-remote-manager-migrate:TAG` | Migrations Prisma (exécution unique) |

Chaque release publie **`latest`** plus des tags de version (ex. `v0.6.1`, `0.6.1`). Les déploiements production utilisent **`latest`** par défaut — aucune version requise dans `.env`.

Remplacez `finenumbers` par le propriétaire de votre fork si vous utilisez un fork (`GHCR_OWNER` dans `.env`).

## Images universelles — APP_URL à l'exécution

Les images sont **agnostiques au domaine**. Définissez `APP_URL` dans `.env` sur votre URL HTTPS publique. Aucun build par domaine requis.

## Obtenir les images

### Option A — Release par tag Git (recommandé)

```bash
git tag v0.7.4
git push origin v0.7.4
```

GitHub Actions publie les images taguées et met à jour `latest`. Les packages doivent être **Public** à la première utilisation (GitHub → Packages → paramètres).

### Option B — Release (dispatch)

Actions → **Release (dispatch)** → saisir `image_tag` (tag personnalisé ; ne met pas à jour `latest` sauf si vous taguez `latest` manuellement).

## Préparer `.env` sur le serveur

```bash
cp .env.production.example .env
# or
./scripts/generate-production-env.sh .env
```

Exemple (secrets requis ; variables d'image optionnelles) :

```bash
APP_URL=https://ufw.example.com
NPM_NETWORK=nginxproxymanager_default
POSTGRES_PASSWORD=...
BETTER_AUTH_SECRET=...
APP_ENCRYPTION_KEY=...
# Optional: GHCR_OWNER=finenumbers  GHCR_IMAGE_TAG=latest
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

Redéployer avec `docker compose ... pull && up -d` — pas de modification `.env` avec `latest`.

Voir [Mise à niveau et rollback](../operations/upgrade-rollback.md) pour épingler une version.

## Dépannage

| Symptôme | Vérifier |
|----------|----------|
| Boucles de redirection auth | `APP_URL` correspond exactement à l'URL publique NPM |
| `pull access denied` | Visibilité du package Public, ou `docker login ghcr.io` |
| `APP_URL is required` | `.env` chargé avec `--env-file .env` |
| NPM 502 | App sur le réseau `npm_proxy` ; nom du conteneur `ufw-app` |

## Documentation associée

- [Vue d'ensemble du déploiement](./overview.md)
- [Tests de fumée](../operations/smoke-tests.md)
