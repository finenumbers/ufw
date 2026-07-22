# UFW Remote Manager — Documentation (Français)

Guide complet pour les administrateurs et opérateurs. Aligné sur la **v0.9.5**.

## Premiers pas

| Document | Description |
|----------|-------------|
| [Introduction](./introduction.md) | Périmètre du produit, prérequis, ce qu'il ne fait pas |
| [Démarrage rapide](./quick-start.md) | Installation Docker locale en quelques minutes |
| [Architecture](./architecture.md) | Composants, SSR cache-first, modèle de données, concurrence |

## Concepts

| Document | Description |
|----------|-------------|
| [Identités SSH](./concepts/ssh-identities.md) | Identifiants réutilisables chiffrés |
| [Serveurs et SSH](./concepts/servers-and-ssh.md) | Validation d'hôte, clés hôte, vérification |
| [Règles UFW et états](./concepts/ufw-rules-and-states.md) | Modèle de règles et couleurs d'état d'origine |
| [Workflow brouillon et application](./concepts/draft-apply-workflow.md) | Édition, aperçu, confirmation, application via SSH |
| [Import et export de configuration](./concepts/import-export-config.md) | Sauvegarde JSON v2 complète |
| [Opérations et concurrence](./concepts/operations-and-concurrency.md) | Bannière, polling, files d'attente, limites de débit |

## Guide utilisateur

| Document | Description |
|----------|-------------|
| [Configuration initiale](./user-guide/initial-setup.md) | Premier compte administrateur et connexion |
| [Gérer les serveurs](./user-guide/manage-servers.md) | Ajout, modification, suppression ; tableau de bord et synchronisation |
| [Éditer et appliquer les règles](./user-guide/edit-and-apply-rules.md) | Édition du tableau, import, aperçu d'application |
| [Historique des opérations](./user-guide/operations-history.md) | Bannière de progression et page d'historique |
| [Scan de ports](./user-guide/port-scan.md) | Résultats du scan externe et couverture UFW |

## Administration

| Document | Description |
|----------|-------------|
| [Modèle de sécurité](./administration/security-model.md) | Chiffrement, authentification, exposition réseau |
| [Variables d'environnement](./administration/environment-variables.md) | Référence complète de la configuration runtime |
| [Journal d'audit et export](./administration/audit-log-and-export.md) | Événements d'audit et export avec réauthentification |

## Déploiement

| Document | Description |
|----------|-------------|
| [Vue d'ensemble](./deployment/overview.md) | Choisir une méthode de déploiement |
| [GHCR + Compose](./deployment/ghcr-compose.md) | Tirer des images préconstruites (recommandé) |
| [Portainer](./deployment/portainer.md) | Déployer via une stack Portainer |
| [Nginx Proxy Manager](./deployment/nginx-proxy-manager.md) | Checklist du reverse proxy HTTPS |
| [Scan externe de ports](./deployment/port-scan.md) | Activer le scan, réseau, délais d'expiration |

## Opérations

| Document | Description |
|----------|-------------|
| [Sauvegarde et restauration](./operations/backup-restore.md) | Sauvegardes Postgres et `.env` |
| [Mise à niveau et retour arrière](./operations/upgrade-rollback.md) | Mises à niveau de version et récupération |
| [Tests de fumée](./operations/smoke-tests.md) | Vérification post-déploiement |

## Référence

| Document | Description |
|----------|-------------|
| [FAQ](./faq.md) | Questions fréquentes |
| [Dépannage](./troubleshooting.md) | Symptôme → cause → correction |
| [À propos de Finenumbers](./about.md) | Auteur et contact |

---

Développé par **[Finenumbers](https://finenumbers.com)** — opérateur téléphonique professionnel pour les entreprises · [apps@finenumbers.com](mailto:apps@finenumbers.com)

Autres langues : [Hub documentation](../README.md)
