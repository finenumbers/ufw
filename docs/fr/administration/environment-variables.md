# Variables d'environnement

Configuration runtime via `.env` (Compose) ou l'interface d'environnement Portainer. **Ne jamais committer de vraies valeurs dans git.**

## Obligatoires (production)

| Variable | Description | Générer |
|----------|-------------|---------|
| `APP_URL` | URL HTTPS publique de l'interface admin | Votre domaine NPM, ex. `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Mot de passe base de données | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Signature de session (**min. 32 caractères** en production) | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | Clé AES pour identifiants SSH (32 octets décodés) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Réseau Docker partagé avec NPM | `docker network ls` |
| `TRUST_PROXY` | Définir à `1` derrière NPM pour des limites de débit setup précises | `1` |

## Déploiement GHCR

Image par défaut : `ghcr.io/finenumbers/ufw-remote-manager:latest` (mise à jour à chaque release).

| Variable | Description | Défaut |
|----------|-------------|--------|
| `GHCR_OWNER` | Propriétaire GitHub (minuscules) | `finenumbers` |
| `GHCR_IMAGE_TAG` | Tag (`latest` ou épingler ex. `v0.9.2`) | `latest` |

Épingler `GHCR_IMAGE_TAG=v0.9.2` pour des déploiements reproductibles ; utiliser `latest` pour les mises à jour automatiques au `pull`.

Legacy `GHCR_APP_IMAGE` / `GHCR_MIGRATE_IMAGE` / `IMAGE_TAG` ne sont plus utilisés.

## Scan de ports (optionnel)

| Variable | Défaut | Description |
|----------|--------|-------------|
| `PORT_SCAN_ENABLED` | non défini (désactivé) | Définir `true` pour activer l'interface et le pipeline |
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | Max ports envoyés à l'enrichissement Nmap |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `1800000` | Timeout découverte complète (30 min) |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Timeout enrichissement (10 min) |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | Exécutions de scan stockées par serveur |

Legacy `PORT_SCAN_RATE_LIMIT_WINDOW_MS` est **ignoré**. Les scans répétés utilisent un cooldown fixe de **30 secondes** dans le code app.

## SSH et proxy

| Variable | Défaut | Description |
|----------|--------|-------------|
| `SSH_ALLOWED_CIDRS` | vide | CIDR autorisés comme cibles SSH, séparés par virgules |
| `TRUST_PROXY` | non défini | `1` = faire confiance à `X-Forwarded-For` pour la limite de débit setup |

## Développement local

| Variable | Défaut | Description |
|----------|--------|-------------|
| `APP_BIND` | `127.0.0.1` | Adresse de bind Compose |
| `APP_PORT` | `8088` | Port hôte |
| `POSTGRES_PORT` | `5434` | Port Postgres hôte |
| `LOG_LEVEL` | `info` | Niveau de log Pino |

## Supprimées / ignorées (historique)

| Variable | Statut |
|----------|--------|
| Anciennes variables d'inventaire conteneurs (pre-v0.9.0) | Ignorées — fonction supprimée en v0.9.0 |
| `PORT_SCAN_RATE_LIMIT_WINDOW_MS` | Ignoré depuis v0.5.1 |

## Limites de débit (fixes dans le code)

Cooldown de 30 secondes par serveur : actualisation/sync UFW, démarrage scan de ports. Non configurable par env.

Buckets en mémoire — réplique unique uniquement. Voir [Architecture](../architecture.md).

## APP_URL vs HTTP interne

| Paramètre | Exemple | Rôle |
|-----------|---------|------|
| **`APP_URL`** | `https://ufw.example.com` | URL navigateur, cookies Better Auth |
| **NPM → app** | `http://ufw-app:8088` | Trafic Docker interne |

Ne **pas** définir `APP_URL` sur l'URL interne du conteneur.

La production exige **HTTPS** sur `APP_URL` sauf `localhost` / `127.0.0.1`.

## Comment les variables atteignent les conteneurs

```yaml
APP_URL: ${APP_URL:-http://localhost:8088}
BETTER_AUTH_URL: ${APP_URL:-http://localhost:8088}
```

L'app lit `APP_URL` ou `BETTER_AUTH_URL` via `getPublicAppUrl()`.

## Modèles

- [`.env.example`](../../../.env.example) — développement local
- [`.env.production.example`](../../../.env.production.example) — modèle production
- [`scripts/generate-production-env.sh`](../../../scripts/generate-production-env.sh) — générateur interactif

## Documentation associée

- [Modèle de sécurité](./security-model.md)
- [Scan externe de ports](../deployment/port-scan.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
