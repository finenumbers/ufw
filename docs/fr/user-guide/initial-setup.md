# Configuration initiale

Au premier lancement, UFW Remote Manager n'a **aucun utilisateur**. Vous devez créer le compte administrateur une fois.

## Page de configuration (`/setup`)

1. Ouvrir l'URL de l'application (ex. `http://localhost:3000` ou votre `APP_URL`)
2. Vous êtes redirigé automatiquement vers `/setup`
3. Saisir le nom, l'e-mail, le mot de passe et la confirmation du mot de passe
4. Cliquer sur **Terminer la configuration**

Après succès, vous êtes connecté et redirigé vers la liste des serveurs.

## Politique d'administrateur unique

L'inscription est **désactivée** après la création du premier compte. Il n'y a pas d'inscription en libre-service pour des utilisateurs supplémentaires dans la version actuelle.

Pour ajouter une autre personne, elle partagerait les identifiants admin (non recommandé) ou vous opérez avec un compte admin par instance.

## Session et connexion

- Les sessions durent **7 jours** avec renouvellement glissant
- Déconnexion via **Déconnexion** dans la barre latérale
- Page de connexion : `/login`

## Premier lancement en production

Après déploiement derrière HTTPS :

1. Configurer NPM Proxy Host → `ufw-app:3000`
2. Définir `APP_URL=https://your-domain.example` dans `.env`
3. Ouvrir `https://your-domain.example/setup`
4. Terminer la configuration avant d'exposer l'URL largement

Lancer le test de fumée après la configuration :

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

## Documentation associée

- [Démarrage rapide](../quick-start.md)
- [Modèle de sécurité](../administration/security-model.md)
