# Déploiement Portainer

Déployez avec **Portainer** en utilisant des images **GHCR** préconstruites derrière un **Nginx Proxy Manager** existant.

NPM n'est pas inclus dans cette stack.

## Prérequis

- Hôte Docker avec Portainer et NPM en cours d'exécution
- Images GHCR depuis les [releases](https://github.com/finenumbers/ufw/releases) — tag `latest` mis à jour à chaque release ; épingler `GHCR_IMAGE_TAG=v0.9.2` si nécessaire
- Nom du réseau Docker NPM (ex. `nginxproxymanager_default`)

```bash
docker network ls | grep -i proxy
docker inspect <npm_container> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

## Variables d'environnement

```bash
./scripts/generate-production-env.sh .env
```

**Obligatoires :** `APP_URL`, `NPM_NETWORK`, `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `APP_ENCRYPTION_KEY`, `TRUST_PROXY=1`

**Optionnelles :** `GHCR_OWNER`, `GHCR_IMAGE_TAG`, `PORT_SCAN_ENABLED=true`

## Créer la stack

### Éditeur web

1. Portainer → **Stacks** → **Add stack**
2. Nom : `ufw-remote-manager`
3. Coller [`deploy/portainer.stack.yml`](../../../deploy/portainer.stack.yml)
4. Environment → **Advanced mode** → coller les secrets `.env`
5. **Deploy the stack**

### Dépôt Git

1. Dépôt : `https://github.com/finenumbers/ufw`
2. Chemin Compose : `deploy/portainer.stack.yml`
3. Définir l'environnement dans l'interface Portainer — ne jamais committer les secrets

## Configurer NPM

Transmettre Proxy Host vers `ufw-app:8088` — voir [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Vérifier

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

Ouvrir `APP_URL/setup` à la première installation.

## Documentation associée

- [GHCR + Compose](./ghcr-compose.md)
- [Vue d'ensemble du déploiement](./overview.md)
