# UFW Remote Manager — Documentation (Français)

Guide complet pour les administrateurs et les opérateurs.

## Premiers pas

| Document | Description |
|----------|-------------|
| [Introduction](./introduction.md) | Ce qu'est le produit et à qui il s'adresse |
| [Démarrage rapide](./quick-start.md) | Installation Docker locale en quelques minutes |
| [Architecture](./architecture.md) | Composants, flux de données, limites de sécurité |

## Concepts

| Document | Description |
|----------|-------------|
| [Identités SSH](./concepts/ssh-identities.md) | Identifiants chiffrés réutilisables |
| [Serveurs et SSH](./concepts/servers-and-ssh.md) | Validation de l'hôte, clés hôte, tests de connexion |
| [Règles UFW et états](./concepts/ufw-rules-and-states.md) | Modèle de règles et états de synchronisation codés par couleur |
| [Workflow brouillon et application](./concepts/draft-apply-workflow.md) | Édition locale, aperçu, confirmation, application via SSH |
| [Import et export de configuration](./concepts/import-export-config.md) | Sauvegarde complète de la configuration serveur (JSON v2) |

## Guide utilisateur

| Document | Description |
|----------|-------------|
| [Configuration initiale](./user-guide/initial-setup.md) | Premier compte administrateur et connexion |
| [Gérer les serveurs](./user-guide/manage-servers.md) | Ajouter, modifier, supprimer des serveurs ; installer/activer UFW |
| [Éditer et appliquer les règles](./user-guide/edit-and-apply-rules.md) | Édition en tableau, import, aperçu d'application |
| [Historique des opérations](./user-guide/operations-history.md) | Bannière de progression et page d'historique |

## Administration

| Document | Description |
|----------|-------------|
| [Modèle de sécurité](./administration/security-model.md) | Chiffrement, authentification, exposition réseau |
| [Variables d'environnement](./administration/environment-variables.md) | Toute la configuration d'exécution |
| [Journal d'audit et export](./administration/audit-log-and-export.md) | Événements d'audit et export avec réauthentification |

## Déploiement

| Document | Description |
|----------|-------------|
| [Vue d'ensemble](./deployment/overview.md) | Choisir une méthode de déploiement |
| [GHCR + Compose](./deployment/ghcr-compose.md) | Tirer des images préconstruites (recommandé) |
| [Portainer](./deployment/portainer.md) | Déployer via une stack Portainer |
| [Nginx Proxy Manager](./deployment/nginx-proxy-manager.md) | Liste de contrôle du proxy inverse HTTPS |

## Opérations

| Document | Description |
|----------|-------------|
| [Sauvegarde et restauration](./operations/backup-restore.md) | Sauvegardes Postgres et `.env` |
| [Mise à niveau et retour arrière](./operations/upgrade-rollback.md) | Mises à niveau de version et reprise |
| [Tests de fumée](./operations/smoke-tests.md) | Vérification post-déploiement |

## Référence

| Document | Description |
|----------|-------------|
| [FAQ](./faq.md) | Questions fréquentes |
| [Dépannage](./troubleshooting.md) | Symptôme → cause → correction |
| [À propos de Finenumbers](./about.md) | Auteur du produit et contact |

---

Développé par **[Finenumbers](https://finenumbers.com)** — opérateur téléphonique professionnel pour les entreprises · [apps@finenumbers.com](mailto:apps@finenumbers.com)

Autres langues : [Hub documentation](../README.md)
