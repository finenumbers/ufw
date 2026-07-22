# FAQ

## Général

### Qu'est-ce qu'UFW Remote Manager ?

Une application web auto-hébergée pour gérer les pare-feu UFW sur des serveurs Linux distants via SSH, avec workflow brouillon/application et piste d'audit.

### Remplace-t-il Nginx Proxy Manager ?

Non. NPM (ou équivalent) termine HTTPS pour l'interface admin. UFW Remote Manager gère les **pare-feu des serveurs distants**, pas votre reverse proxy.

### Puis-je gérer des conteneurs Docker ?

Non. La surveillance des conteneurs Docker a été **supprimée en v0.9.0**. L'application gère uniquement les règles UFW et les scans externes de ports optionnels.

### Combien d'utilisateurs administrateurs ?

Un compte après la configuration initiale `/setup`. Pas d'interface multi-utilisateur.

### Puis-je exécuter plusieurs répliques de l'application ?

Non recommandé. Les limites de débit et les files d'attente sont en mémoire (conception à réplique unique).

## SSH et serveurs

### Pourquoi une IP privée est-elle rejetée ?

Sécurité par défaut — bloque RFC1918 et les adresses de métadonnées. Définissez `SSH_ALLOWED_CIDRS` pour les cibles lab/VPN.

### Pourquoi l'application est-elle désactivée ?

La clé hôte SSH peut être **non vérifiée**. Exécutez d'abord **Actualiser le statut** avec succès.

### La suppression d'un serveur modifie-t-elle UFW distant ?

Non. La suppression retire uniquement les données de gestion locales.

## Règles et application

### Aperçu vs confirmation ?

L'aperçu montre les modifications prévues sans les exécuter. La confirmation exécute les commandes UFW via SSH.

### Le distant a changé depuis l'aperçu ?

Application rejetée — relancez **Aperçu d'application**. N'utilisez pas la resynchronisation forcée dans ce cas.

### Application partielle ?

Voir [Workflow brouillon et application](./concepts/draft-apply-workflow.md). Utilisez **Resynchronisation forcée depuis le serveur** lorsque indiqué.

### Pourquoi les comptes de règles diffèrent-ils ?

**Règles enregistrées** (carte de liste) vs **dans le tableau** (tableau de bord) comptent des choses différentes — voir [Règles UFW et états](./concepts/ufw-rules-and-states.md).

## Interface des opérations

### Bannière bloquée sur EN COURS ?

Actualisez la page. Le nettoyeur efface les opérations obsolètes dans ~30–60 minutes.

### Règles non mises à jour après sync ?

Depuis v0.9.2, la fin d'opération doit déclencher l'actualisation de la page. Essayez une actualisation manuelle du navigateur une fois.

## Scan de ports

### Bouton de scan absent ?

`PORT_SCAN_ENABLED` n'est pas défini à `true` dans l'environnement de l'application.

### Scan déjà en cours ?

Un seul scan actif par serveur. Attendez ou consultez l'historique des opérations.

### Le scan bloque-t-il l'actualisation UFW ?

Non (depuis v0.9.2). Le scan s'exécute hors file SSH.

## Déploiement

### Où exécuter les migrations ?

Dans le conteneur **migrate** / **ufw-migrate** — pas dans **ufw-app**. Voir [Vue d'ensemble du déploiement](./deployment/overview.md).

### EACCES en exécutant prisma dans le conteneur app ?

Attendu — utilisez `docker compose run --rm migrate`.

## Documentation associée

- [Dépannage](./troubleshooting.md)
- [Introduction](./introduction.md)
