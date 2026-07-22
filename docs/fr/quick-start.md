# Démarrage rapide

Exécutez UFW Remote Manager localement avec Docker. Ce parcours est destiné à **l'évaluation et au développement**, pas à la production.

## Prérequis

- Docker et Docker Compose
- Git
- Port **8088** libre sur localhost (configurable via `APP_PORT`)

## 1. Cloner et configurer

```bash
git clone https://github.com/finenumbers/ufw.git
cd ufw
cp .env.example .env
```

Les valeurs par défaut de `.env` conviennent à un usage local. Les secrets sont préremplis pour le développement uniquement — générez-en de nouveaux pour tout déploiement partagé ou en production.

## 2. Démarrer la stack

```bash
docker compose up -d --build
```

Cela démarre :

| Service | Rôle |
|---------|------|
| **postgres** | Base de données PostgreSQL |
| **migrate** | Exécute `prisma migrate deploy` une fois, puis se termine |
| **app** | Interface Next.js sur le port 8088 |

Vérifier l'état :

```bash
docker compose ps
docker compose logs -f app
```

## 3. Créer le compte administrateur

Ouvrir **http://localhost:8088/setup**

- L'inscription n'est disponible **qu'une seule fois** — tant qu'aucun utilisateur n'existe
- Après la configuration, `/setup` redirige vers la connexion
- Utilisez un mot de passe robuste ; c'est le seul compte administrateur

## 4. Créer une identité SSH

1. Barre latérale → **Identités SSH** → **Ajouter une identité**
2. Choisir l'authentification : mot de passe, clé privée ou clé avec passphrase
3. Enregistrer — les identifiants sont chiffrés avec `APP_ENCRYPTION_KEY`

Voir [Identités SSH](./concepts/ssh-identities.md).

## 5. Ajouter un serveur

1. Barre latérale → **Serveurs** → **Ajouter un serveur**
2. Saisir le nom, l'hôte, le port, sélectionner l'identité
3. **Créer le serveur** vérifie SSH automatiquement

En cas de succès, vous arrivez sur le tableau de bord du serveur. Le badge UFW affiche l'état en cache (vide jusqu'à la première actualisation).

## 6. Actualiser et travailler avec les règles

1. Cliquer sur **Actualiser le statut** — lecture SSH en direct ; crée le premier snapshot UFW
2. Si UFW est absent, utiliser **Installer UFW** (après que l'actualisation confirme qu'il n'est pas installé)
3. Lorsque UFW est actif, éditer les règles dans le tableau
4. **Aperçu d'application** → révision → **Confirmer** pour pousser les modifications

Si aucun snapshot n'existe encore, une **synchronisation initiale** automatique en arrière-plan peut s'exécuter une fois — voir [Gérer les serveurs](./user-guide/manage-servers.md).

## Optionnel : activer le scan de ports localement

Ajouter à `.env` :

```env
PORT_SCAN_ENABLED=true
```

Reconstruire/redémarrer le conteneur app. Le scan de ports nécessite Naabu et Nmap dans l'image (inclus dans le Dockerfile officiel).

## Développement sans l'application Docker complète

Exécuter uniquement Postgres dans Docker, l'application sur l'hôte :

```bash
docker compose up -d postgres
npm install
npm run db:migrate
npm run dev
```

L'application écoute sur **http://localhost:8088** (voir `package.json`).

## Arrêt et réinitialisation

```bash
docker compose down          # arrêter les conteneurs
docker compose down -v       # arrêter et supprimer le volume de base de données
```

## Prochaines étapes

- [Architecture](./architecture.md)
- [Déploiement en production](./deployment/overview.md)
- [Modèle de sécurité](./administration/security-model.md)
