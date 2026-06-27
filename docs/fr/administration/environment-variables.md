# Variables d'environnement

La configuration d'exécution est fournie via `.env` (Compose) ou l'interface d'environnement Portainer. **Ne commitez jamais de vraies valeurs dans git.**

## Obligatoires (production)

| Variable | Description | Génération |
|----------|-------------|------------|
| `APP_URL` | URL HTTPS publique de l'interface admin | Votre domaine NPM, ex. `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Mot de passe de la base de données | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Secret de signature de session | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | Clé AES pour identifiants SSH (32 octets décodés) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Nom du réseau Docker partagé avec NPM | `docker network ls` |

## Déploiement GHCR (optionnel)

Compose et le stack Portainer utilisent par défaut `ghcr.io/finenumbers/ufw-remote-manager:latest`. Chaque release GitHub met à jour le tag `latest`.

| Variable | Description | Défaut |
|----------|-------------|--------|
| `GHCR_OWNER` | Propriétaire GitHub (minuscules) | `finenumbers` |
| `GHCR_IMAGE_TAG` | Tag image (`latest` ou ex. `v0.2.1`) | `latest` |

## Optionnelles

| Variable | Description | Défaut |
|----------|-------------|--------|
| `SSH_ALLOWED_CIDRS` | CIDR séparés par des virgules autorisés comme cibles SSH | Vide (IP privées bloquées) |
| `APP_BIND` | Adresse de liaison compose locale | `127.0.0.1` |
| `APP_PORT` | Port hôte pour compose local | `8088` |
| `POSTGRES_PORT` | Port hôte Postgres en dev | `5434` |
| `LOG_LEVEL` | Niveau de journal Pino | `info` |

## Limites de débit (fixes)

Les actions répétées sur un serveur ont un délai de **30 secondes** (non configurable via variables d'environnement) :

- Actualisation du statut UFW et synchronisation des règles
- Démarrage d'un scan de ports
- Actualisation de l'inventaire Docker
- Démarrage, arrêt et redémarrage de conteneurs Docker

Depuis **v0.5.1**, les variables héritées `PORT_SCAN_RATE_LIMIT_WINDOW_MS`, `DOCKER_REFRESH_RATE_LIMIT_WINDOW_MS` et `DOCKER_CONTROL_RATE_LIMIT_WINDOW_MS` sont **ignorées** si elles restent dans `.env`.

## Comment les variables atteignent les conteneurs

Dans `docker-compose.yml` :

```yaml
APP_URL: ${APP_URL:-http://localhost:8088}
BETTER_AUTH_URL: ${APP_URL:-http://localhost:8088}
```

L'application lit `APP_URL` ou `BETTER_AUTH_URL` à l'exécution (`getPublicAppUrl()`).

## Modèles et générateurs

- [`.env.example`](../../../.env.example) — développement local
- [`.env.production.example`](../../../.env.production.example) — modèle production
- [`scripts/generate-production-env.sh`](../../../scripts/generate-production-env.sh) — générateur interactif

## Documentation associée

- [Modèle de sécurité](./security-model.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
