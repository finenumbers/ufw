# Introduction

**UFW Remote Manager** est une application web auto-hébergée pour gérer **UFW (Uncomplicated Firewall)** sur des serveurs Linux distants via **SSH**. Vous éditez les règles de pare-feu dans un navigateur, prévisualisez les modifications, confirmez explicitement et les appliquez en toute sécurité — avec une piste d'audit complète.

Dépôt : [github.com/finenumbers/ufw](https://github.com/finenumbers/ufw)

## À qui s'adresse-t-il ?

- **Administrateurs système** qui gèrent plusieurs serveurs Linux et préfèrent une interface structurée aux sessions CLI `ufw` manuelles
- **Petites équipes** ayant besoin d'un point central pour les brouillons de pare-feu, les aperçus d'application et l'historique des opérations
- **Auto-hébergeurs** qui exécutent leur propre infrastructure derrière un proxy inverse (Nginx Proxy Manager recommandé)

## Ce qu'il fait

- Se connecter à des serveurs Linux via SSH (mot de passe ou clé privée)
- Détecter, installer et activer UFW à distance
- Charger les règles UFW en direct, les éditer dans un tableau (avec groupes, noms, recherche, réordonnancement)
- Workflow **brouillon → aperçu → confirmation → application** avec visualisation des différences
- Importer des règles depuis CSV, XLSX ou JSON ; exporter/importer la configuration complète des serveurs
- Chiffrer les identifiants SSH au repos ; épingler les clés hôte SSH ; auditer les actions sensibles
- Interface multilingue (anglais, allemand, français, espagnol, italien, portugais, russe)

## Ce qu'il ne fait pas

| Attente | Réalité |
|---------|---------|
| Remplace votre proxy inverse | **Non.** Nginx Proxy Manager (ou équivalent) termine HTTPS séparément |
| Gère `iptables` brut sans UFW | **Non.** Cible les serveurs où UFW est l'interface du pare-feu |
| SaaS multi-locataire | **Non.** Auto-hébergé en instance unique ; un compte admin après la configuration |
| Cluster haute disponibilité | **Non.** Conçu pour **une seule réplique** de l'application (limites de débit en mémoire) |
| Modifications automatiques du pare-feu sans confirmation | **Non.** L'application exige toujours une confirmation explicite |

## Prérequis

### Hôte de gestion (où Docker s'exécute)

- Docker et Docker Compose
- Optionnel : Portainer, installation existante de Nginx Proxy Manager
- Accès réseau depuis le conteneur de l'application vers les serveurs cibles sur SSH (port 22 ou personnalisé)

### Serveurs cibles (hôtes Linux gérés)

- Linux avec UFW disponible (`apt install ufw` ou équivalent)
- Accès SSH avec privilèges suffisants pour exécuter les commandes `ufw`
- Connectivité sortante depuis l'hôte de gestion vers le port SSH du serveur

### Production

- URL **HTTPS** publique pour l'interface d'administration (`APP_URL`)
- Secrets robustes dans `.env` (jamais commités dans git)

## Prochaines étapes

- [Démarrage rapide](./quick-start.md) — exécuter localement dans Docker
- [Architecture](./architecture.md) — comment les composants s'articulent
- [Vue d'ensemble du déploiement](./deployment/overview.md) — production derrière NPM
