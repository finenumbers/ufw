# Surveillance des conteneurs Docker

UFW Remote Manager peut inventorier et contrôler les **conteneurs Docker** sur chaque serveur enregistré via **SSH** (même transport que les opérations UFW).

Les résultats apparaissent dans un tableau **sous le panneau de scan de ports** sur la page du serveur.

## Activer

Définir dans l'environnement de l'application (Compose / Portainer) :

```env
DOCKER_MONITOR_ENABLED=true
```

Réglages optionnels :

| Variable | Défaut | Rôle |
|----------|--------|------|
| `DOCKER_INVENTORY_HISTORY_LIMIT` | `10` | Snapshots d'inventaire stockés par serveur |
| `DOCKER_COMMAND_TIMEOUT_MS` | `60000` | Délai d'expiration des commandes SSH pour Docker CLI |

L'actualisation de l'inventaire et le contrôle des conteneurs (start/stop/restart) partagent un délai de **30 secondes** par serveur (fixé dans le code depuis v0.5.1). Les anciens `DOCKER_REFRESH_RATE_LIMIT_WINDOW_MS` et `DOCKER_CONTROL_RATE_LIMIT_WINDOW_MS` dans `.env` sont **ignorés**.

## Exigences sur les serveurs gérés

- **Docker CLI** installé (`docker` dans PATH)
- Démon Docker accessible pour l'utilisateur SSH
- Soit appartenance au groupe **`docker`**, soit **sudo sans mot de passe** pour `docker`

L'application essaie d'abord `docker …`, puis `sudo docker …` en cas de refus de permission.

## Fonctionnalités (MVP)

- Actualiser l'inventaire : `docker ps -a`, statistiques pour les conteneurs en cours d'exécution
- Tableau : nom, image, statut, santé, ports, CPU/mémoire, labels Compose
- Regroupement par projet Compose
- Tiroir de détail du conteneur (`docker inspect`, variables d'env masquées)
- Contrôle : **start**, **stop**, **restart** (confirmation pour stop/restart)
- Bannière de progression d'opération + événements d'audit

## Sécurité

- Feature flag (désactivé par défaut)
- Validation ID/nom de conteneur — pas de shell arbitraire depuis l'interface
- Actions de contrôle fixes uniquement
- Limites de débit fixes de 30s sur actualisation et contrôle (non configurables par env)
- Audit : `DOCKER_INVENTORY_REFRESHED`, `DOCKER_CONTAINER_*`

## Interrogation de progression

Pendant l'actualisation de l'inventaire, l'interface interroge un point de terminaison de statut léger. L'intervalle d'interrogation augmente : **3s → 5s → 10s**. La bannière d'opération affiche la progression des étapes.

## Documentation associée

- [Vue d'ensemble du déploiement](./overview.md)
- [Modèle de sécurité](../administration/security-model.md)
