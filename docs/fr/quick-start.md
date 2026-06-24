# Démarrage rapide (local)

Exécutez UFW Remote Manager sur votre machine avec Docker. Ce parcours est destiné à **l'évaluation et au développement**, pas à la production.

## 1. Cloner et configurer

```bash
git clone https://github.com/finenumbers/ufw.git
cd ufw
cp .env.example .env
```

Le `.env` par défaut utilise des valeurs adaptées au développement. N'utilisez **pas** ces valeurs par défaut en production.

## 2. Démarrer la stack

```bash
docker compose up -d --build
```

Attendez que tous les conteneurs soient sains :

```bash
docker compose ps
```

Vous devriez voir `ufw-postgres` (healthy), `ufw-migrate` (exited 0) et `ufw-app` (healthy).

## 3. Ouvrir l'interface

Ouvrez **http://localhost:8088** dans votre navigateur.

- **Première visite :** `/setup` — créer le compte administrateur unique
- **Visites suivantes :** `/login`

## 4. Premier workflow dans l'interface

1. **Identités SSH** (`/identities`) — créer des identifiants (mot de passe ou clé privée)
2. **Ajouter un serveur** — choisir l'identité, saisir hôte/port ; un test SSH s'exécute avant l'enregistrement
3. Sur la page du serveur — installer/activer UFW si nécessaire, puis ouvrir **Règles**
4. Éditer les règles, cliquer sur **Enregistrer les règles**, confirmer pour pousser les modifications via SSH

## Commandes utiles

```bash
docker compose logs -f app          # journaux de l'application
docker compose down                 # arrêter la stack
docker compose down -v              # arrêter et supprimer le volume de base de données
```

## Développement sur l'hôte (optionnel)

Exécutez uniquement Postgres dans Docker et l'application sur l'hôte :

```bash
docker compose up -d postgres
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Utilisez le port **5434** dans `DATABASE_URL` pour l'accès depuis l'hôte (voir `.env.example`).

## Production

Pour un déploiement HTTPS derrière Nginx Proxy Manager, voir [Vue d'ensemble du déploiement](./deployment/overview.md).
