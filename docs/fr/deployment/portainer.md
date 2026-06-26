# Déploiement Portainer

Déployez avec **Portainer** en utilisant des images **GHCR** préconstruites derrière un **Nginx Proxy Manager** existant.

NPM n'est pas inclus dans cette stack.

## Prérequis

- Hôte Docker avec Portainer et NPM en cours d'exécution
- Images GHCR depuis les [releases](https://github.com/finenumbers/ufw/releases)
- Nom du réseau Docker NPM (ex. `nginxproxymanager_default`)

Trouver le réseau NPM :

```bash
docker network ls | grep -i proxy
docker inspect <npm_container> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

## Préparer les variables d'environnement

```bash
./scripts/generate-production-env.sh .env
```

Ou copier [`.env.production.example`](../../../.env.production.example).

Obligatoires : `APP_URL`, `NPM_NETWORK`, `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `APP_ENCRYPTION_KEY`. Optionnel : `GHCR_OWNER`, `GHCR_IMAGE_TAG` (défaut `latest`).

## Créer la stack

### Éditeur web

1. Portainer → **Stacks** → **Add stack**
2. Nom : `ufw-remote-manager`
3. Coller [`deploy/portainer.stack.yml`](../../../deploy/portainer.stack.yml)
4. Environment variables → **Advanced mode** → coller le contenu de `.env`
5. **Deploy the stack**

### Dépôt Git

1. URL du dépôt : `https://github.com/finenumbers/ufw`
2. Chemin Compose : `deploy/portainer.stack.yml`
3. Définir l'environnement dans l'interface Portainer (ne jamais committer les secrets dans git)

## Configurer NPM

Voir [Nginx Proxy Manager](./nginx-proxy-manager.md) — redirection vers `ufw-app:8088`.

## Vérifier

1. Conteneurs de la stack sains ; `ufw-migrate` exited 0
2. Navigateur → `APP_URL/setup` ou `/login`
3. `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

## Mise à niveau et sauvegarde

- [Mise à niveau et retour arrière](../operations/upgrade-rollback.md)
- [Sauvegarde et restauration](../operations/backup-restore.md)

## Documentation associée

- [GHCR + Compose](./ghcr-compose.md)
- [Modèle de sécurité](../administration/security-model.md)
