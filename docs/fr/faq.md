# FAQ

## Général

**Qu'est-ce qu'UFW Remote Manager ?**  
Une interface web auto-hébergée pour gérer les pare-feu UFW sur des serveurs Linux distants via SSH, avec workflow brouillon/application et journalisation d'audit.

**Est-ce gratuit ?**  
Open source sous licence MIT. Vous fournissez l'infrastructure (hôte Docker, domaine, SSL).

**Qui l'a développé ?**  
[Finenumbers](https://finenumbers.com) — voir [À propos](./about.md).

## Comptes

**Puis-je créer plusieurs utilisateurs administrateurs ?**  
Pas via l'inscription automatique. Un seul compte est créé sur `/setup` ; les inscriptions supplémentaires sont désactivées.

**J'ai oublié mon mot de passe.**  
La réinitialisation nécessite un accès à la base de données ou une restauration depuis une sauvegarde. Il n'y a pas de réinitialisation par e-mail dans la configuration par défaut.

## Déploiement

**Ai-je besoin d'une image Docker par domaine ?**  
Non. Définissez `APP_URL` dans `.env` à l'exécution. Une image GHCR fonctionne pour n'importe quel domaine HTTPS.

**Est-ce que cela inclut Nginx Proxy Manager ?**  
Non. NPM (ou un autre proxy inverse) doit être installé séparément.

**Puis-je exécuter sans HTTPS ?**  
Le développement local utilise `http://localhost:3000`. La production attend HTTPS pour les cookies sécurisés et HSTS.

## Opérations pare-feu

**La suppression d'un serveur supprime-t-elle les règles UFW distantes ?**  
Non. Seuls les enregistrements locaux de la base de données sont supprimés.

**Que se passe-t-il si l'application échoue à mi-parcours ?**  
UFW distant peut être partiellement mis à jour. Utilisez **Resynchronisation forcée depuis le serveur** et consultez l'**Historique des opérations**. Voir [Workflow brouillon et application](./concepts/draft-apply-workflow.md).

**Puis-je gérer des serveurs sur des IP privées ?**  
Oui, définissez `SSH_ALLOWED_CIDRS` dans `.env` pour autoriser vos plages internes.

## Données et sécurité

**Où sont stockées les clés SSH ?**  
Chiffrées dans Postgres avec `APP_ENCRYPTION_KEY`. La clé `.env` est obligatoire pour le déchiffrement.

**L'export de configuration est-il sûr ?**  
L'export contient des **secrets en clair**. Une resaisie du mot de passe est requise ; conservez les exports en lieu sûr.

## Support

Contactez **[apps@finenumbers.com](mailto:apps@finenumbers.com)** pour les questions produit.

Vulnérabilités de sécurité : voir [SECURITY.md](../../SECURITY.md) — n'ouvrez pas d'issues GitHub publiques.
