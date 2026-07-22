# Vue d'ensemble du déploiement

Choisissez comment exécuter UFW Remote Manager en production. Tous les parcours utilisent Docker ; PostgreSQL est requis.

## Parcours recommandé

**Images préconstruites GHCR + overlays Compose + Nginx Proxy Manager**

```bash
./scripts/generate-production-env.sh .env
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

Voir [GHCR + Compose](./ghcr-compose.md) et [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Méthodes de déploiement

| Méthode | Quand l'utiliser | Build sur serveur ? |
|---------|------------------|---------------------|
| **GHCR + Compose** | Production par défaut | Non — `docker compose pull` |
| **Build Compose local** | Air-gapped ou développement fork | Oui — `docker compose build` |
| **Stack Portainer** | Ops pilotées par GUI | Optionnel — utilise GHCR ou build |

## Couches de fichiers Compose

| Fichier | Rôle |
|---------|------|
| `docker-compose.yml` | Base : postgres, migrate, app |
| `docker-compose.prod.yml` | Production : pas de ports publiés, réseau NPM, env prod |
| `docker-compose.ghcr.yml` | Tirer images depuis GHCR au lieu du build local |

Combiner avec les flags `-f`. Toujours passer `--env-file .env` en production.

## Conteneur de migration

À chaque `up`, **ufw-migrate** exécute `prisma migrate deploy` une fois et se termine. Ne **pas** exécuter `prisma migrate` manuellement dans **ufw-app** — utiliser le service migrate :

```bash
docker compose run --rm migrate
```

v0.9.2 n'a **pas de nouvelle migration** au-delà des releases précédentes — la mise à niveau est pull et up.

## Fonctionnalités optionnelles au déploiement

| Fonctionnalité | Activer |
|----------------|---------|
| Scan de ports | `PORT_SCAN_ENABLED=true` — voir [Scan externe de ports](./port-scan.md) |
| Cibles SSH privées | `SSH_ALLOWED_CIDRS=10.0.0.0/8,...` |

Le moniteur de conteneurs Docker a été **supprimé en v0.9.0** — pas de flag env.

## Épinglage de version

| Stratégie | Paramètre |
|-----------|-----------|
| Suivre la dernière release | `GHCR_IMAGE_TAG=latest` (défaut) |
| Épingler version | `GHCR_IMAGE_TAG=v0.9.2` |

## Documentation associée

- [GHCR + Compose](./ghcr-compose.md)
- [Portainer](./portainer.md)
- [Variables d'environnement](../administration/environment-variables.md)
- [Mise à niveau et retour arrière](../operations/upgrade-rollback.md)
