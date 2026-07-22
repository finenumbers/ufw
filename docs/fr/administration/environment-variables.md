# Variables d'environnement

La configuration d'exécution est fournie via `.env` (Compose) ou l'interface d'environnement Portainer. **Ne commitez jamais de vraies valeurs dans git.**

## Obligatoires (production)

| Variable | Description | Génération |
|----------|-------------|------------|
| `APP_URL` | URL publique de l'interface admin (HTTPS pour les vrais domaines) | Votre domaine NPM, ex. `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Mot de passe de la base de données | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Secret de signature de session (**min. 32 caractères** en production) | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | Clé AES pour identifiants SSH (32 octets décodés) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Nom du réseau Docker partagé avec NPM | `docker network ls` |

## Déploiement GHCR (optionnel)

Compose et le stack Portainer utilisent par défaut `ghcr.io/finenumbers/ufw-remote-manager:latest`. Chaque release GitHub met à jour le tag `latest`.

| Variable | Description | Défaut |
|----------|-------------|--------|
| `GHCR_OWNER` | Propriétaire GitHub (minuscules) | `finenumbers` |
| `GHCR_IMAGE_TAG` | Tag image (`latest` ou épingler ex. `v0.2.1`) | `latest` |

Les variables héritées `GHCR_APP_IMAGE` / `GHCR_MIGRATE_IMAGE` / `IMAGE_TAG` ne sont plus requises — les URL d'images sont construites à partir du propriétaire + tag dans les fichiers compose.

## Optionnelles

| Variable | Description | Défaut |
|----------|-------------|--------|
| `SSH_ALLOWED_CIDRS` | CIDR séparés par des virgules autorisés comme cibles SSH | Vide (IP privées bloquées) |
| `TRUST_PROXY` | Définir à `1` lorsque l'application tourne derrière Nginx Proxy Manager pour que les limites de débit de `/setup` utilisent `X-Forwarded-For` | Non défini (en-têtes transférés ignorés) |
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

Depuis **v0.5.1**, les variables héritées telles que `PORT_SCAN_RATE_LIMIT_WINDOW_MS` sont **ignorées** si elles restent dans `.env`.

Les buckets de limitation en mémoire sont évincés lorsqu'ils sont vides (déploiement réplique unique uniquement — voir [Architecture](../architecture.md)).

## APP_URL vs HTTP interne

Deux URL différentes remplissent des rôles distincts :

| Paramètre | Exemple | Rôle |
|-----------|---------|------|
| **`APP_URL`** | `https://ufw.example.com` | URL publique pour Better Auth, cookies et redirections navigateur |
| **Schéma Proxy Host NPM** | `http` → `ufw-app:8088` | Trafic Docker interne ; NPM termine TLS |

Ne **définissez pas** `APP_URL` sur l'URL interne du conteneur. Better Auth exige le domaine HTTPS public que les utilisateurs saisissent dans le navigateur.

En production, `APP_URL` doit utiliser **HTTPS** pour les vrais noms d'hôte. Les seules exceptions sont `http://localhost` et `http://127.0.0.1` (tests fumée locaux et CI).

## Production derrière NPM

Lorsque `ufw-app` est derrière Nginx Proxy Manager sur un réseau Docker partagé :

1. Définissez `TRUST_PROXY=1` dans l'environnement de l'application pour que les limites de débit de `/setup` utilisent l'IP client depuis `X-Forwarded-For` (NPM définit cet en-tête).
2. Sans `TRUST_PROXY`, les limites de setup utilisent un bucket partagé unique (`direct`) — acceptable en dev local, pas idéal en production.

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
