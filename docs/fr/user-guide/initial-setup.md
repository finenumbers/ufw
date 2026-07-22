# Configuration initiale

Le premier lancement crée le seul compte administrateur. Ensuite, l'inscription est définitivement désactivée.

## Page de configuration (`/setup`)

Disponible lorsqu'**aucun utilisateur** n'existe en base de données :

1. Ouvrir `http://localhost:8088/setup` (ou votre `APP_URL/setup`)
2. Saisir e-mail et mot de passe
3. Soumettre — vous êtes connecté et redirigé vers l'application

Si un utilisateur existe déjà, `/setup` redirige vers `/login`.

## Connexion (`/login`)

Utilisez l'e-mail et le mot de passe de la configuration. Les sessions sont gérées par Better Auth (cookies HTTP-only).

Déconnexion : barre latérale → **Déconnexion**.

## Modèle administrateur unique

Il n'y a pas d'interface de gestion des utilisateurs. Un compte par installation. Pour un accès partagé, utilisez un gestionnaire de mots de passe d'équipe et des procédures opérationnelles — pas des utilisateurs d'application séparés.

## Limitation de débit setup

Les tentatives de configuration sont limitées à **5 par minute par IP client** pour ralentir la force brute sur les installations fraîches.

Lorsque l'application s'exécute derrière Nginx Proxy Manager en production, définissez :

```env
TRUST_PROXY=1
```

Sans cela, les limites de débit utilisent un bucket partagé unique et peuvent être moins précises derrière un proxy.

## Première visite en production

1. Déployer la stack — voir [Vue d'ensemble du déploiement](../deployment/overview.md)
2. Ouvrir `https://your-domain/setup` (doit correspondre à `APP_URL`)
3. Terminer la configuration avant d'exposer l'URL largement
4. Exécuter les [tests de fumée](../operations/smoke-tests.md)

## Documentation associée

- [Démarrage rapide](../quick-start.md)
- [Modèle de sécurité](../administration/security-model.md)
