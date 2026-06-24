# Vue d'ensemble du déploiement

Choisissez comment exécuter UFW Remote Manager en production. Tous les parcours supposent **HTTPS** via un proxy inverse existant (Nginx Proxy Manager recommandé).

![Flux de déploiement](../../assets/deploy-flow.svg)

## Comparaison

| Méthode | Idéal pour | Construire des images ? |
|---------|------------|-------------------------|
| [GHCR + Compose](./ghcr-compose.md) | La plupart des auto-hébergeurs | Non — tirer depuis GitHub Packages |
| [Portainer](./portainer.md) | Gestion de stack via GUI | Non — tirer les images GHCR |
| Compose local build | Développement air-gapped ou fork | Oui — `docker compose build` |

Nginx Proxy Manager est **toujours externe** — non inclus dans ce dépôt.

## Services de la stack

| Conteneur | Rôle |
|-----------|------|
| `ufw-postgres` | Base de données |
| `ufw-migrate` | Exécute les migrations BD une fois par déploiement |
| `ufw-app` | Application web |

## Parcours production recommandé

1. Tirer le tag d'image `v0.1.0` (ou dernière release) depuis GHCR
2. Générer `.env` sur le serveur : `./scripts/generate-production-env.sh .env`
3. Déployer avec Compose + `docker-compose.prod.yml` + `docker-compose.ghcr.yml`
4. Configurer NPM Proxy Host → `ufw-app:3000`
5. Ouvrir `APP_URL/setup`, créer l'admin
6. Exécuter `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

## Images universelles

Définissez `APP_URL` dans `.env` au déploiement. La même image GHCR fonctionne pour n'importe quel domaine — pas de build d'image par client.

## Discipline des secrets

- Générer les secrets sur le serveur uniquement
- Mode fichier `600` pour `.env`
- Ne jamais stocker les secrets dans le dépôt git de la stack Portainer ou des tickets publics

## Documentation associée

- [Nginx Proxy Manager](./nginx-proxy-manager.md)
- [Variables d'environnement](../administration/environment-variables.md)
- [Tests de fumée](../operations/smoke-tests.md)
