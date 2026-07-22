# Introduction

**UFW Remote Manager** est une application web auto-hébergée pour gérer **UFW (Uncomplicated Firewall)** sur des serveurs Linux distants via **SSH**. Vous éditez les règles de pare-feu dans un navigateur, prévisualisez les modifications, confirmez explicitement et les appliquez en toute sécurité — avec une piste d'audit complète.

Dépôt : [github.com/finenumbers/ufw](https://github.com/finenumbers/ufw) · Version actuelle : **v0.9.6**

## À qui s'adresse-t-il ?

- **Administrateurs système** gérant plusieurs serveurs Linux qui préfèrent une interface structurée aux sessions CLI `ufw` répétées
- **Petites équipes** ayant besoin d'un point central pour les brouillons de pare-feu, les aperçus d'application et l'historique des opérations
- **Auto-hébergeurs** exécutant une infrastructure derrière un reverse proxy (Nginx Proxy Manager recommandé)

## Ce qu'il fait

| Capacité | Description |
|----------|-------------|
| **Gestion SSH** | Connexion par mot de passe ou clé privée ; épinglage de clé hôte à la première connexion |
| **Cycle de vie UFW** | Détection, installation et activation de UFW à distance |
| **Tableau de règles** | Édition avec groupes, noms, recherche, filtres, réordonnancement par glisser-déposer |
| **Brouillon → application** | Aperçu du diff, confirmation, puis exécution des commandes UFW via SSH |
| **Tableaux de bord rapides** | Les pages serveur se chargent depuis les snapshots Postgres en cache ; SSH en direct uniquement lors de l'actualisation |
| **Import / export** | Règles depuis CSV, XLSX, JSON ; configuration complète serveurs + identités en JSON v2 |
| **Scan de ports (optionnel)** | Scan TCP externe avec cartographie de couverture UFW |
| **Sécurité** | Identifiants chiffrés au repos ; journal d'audit ; mot de passe de réauthentification pour l'export de configuration |
| **Langues** | Interface en anglais, allemand, français, espagnol, italien, portugais (Brésil), russe |

## Ce qu'il ne fait pas

| Attente | Réalité |
|---------|---------|
| Remplace votre reverse proxy | **Non.** Nginx Proxy Manager (ou équivalent) termine HTTPS séparément |
| Gère `iptables` brut sans UFW | **Non.** Cible les serveurs où UFW est le front-end pare-feu |
| Inventaire / contrôle de conteneurs Docker | **Non.** Supprimé en v0.9.0 — hors périmètre actuel |
| SaaS multi-locataire | **Non.** Instance auto-hébergée unique ; un compte admin après la configuration |
| Cluster haute disponibilité | **Non.** Conçu pour **une seule réplique** d'application (limites de débit en mémoire) |
| Modifications silencieuses automatiques du pare-feu | **Non.** L'application exige toujours une confirmation explicite de l'utilisateur |

## Inventaire et statistiques

Après la v0.9.0, **l'inventaire** sur la liste des serveurs signifie :

- **Règles enregistrées** — nombre de règles stockées dans les métadonnées locales (`ruleRecord`)
- **Ports ouverts** — nombre issu du dernier scan externe de ports réussi (si activé)

Il n'y a pas de panneau de conteneurs Docker ni de surveillance distante de conteneurs.

## Prérequis

### Hôte de gestion (où Docker s'exécute)

- Docker et Docker Compose
- Optionnel : Portainer, Nginx Proxy Manager existant
- Réseau depuis le conteneur de l'application vers les serveurs cibles en SSH (port 22 ou personnalisé)
- Pour le scan de ports : sortie depuis l'hôte de l'application vers les ports TCP cibles (pas seulement `:22`)

### Serveurs cibles (hôtes Linux gérés)

- Linux avec UFW disponible (`apt install ufw` ou équivalent)
- Accès SSH avec privilèges pour exécuter les commandes `ufw`
- Port SSH accessible depuis l'hôte de gestion

### Production

- URL **HTTPS** publique pour l'interface admin (`APP_URL`)
- Secrets robustes dans `.env` (jamais commités dans git)

## Prochaines étapes

- [Démarrage rapide](./quick-start.md) — exécuter localement dans Docker
- [Architecture](./architecture.md) — composants, flux de données, concurrence
- [Vue d'ensemble du déploiement](./deployment/overview.md) — production derrière NPM
