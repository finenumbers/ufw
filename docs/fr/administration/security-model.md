# Modèle de sécurité

UFW Remote Manager est un **outil d'administration privilégié** : il stocke des secrets SSH, exécute des commandes de pare-feu distantes et expose une interface web. Les hypothèses de conception et les contrôles sont documentés ici.

## Modèle de menace (résumé)

| Actif | Risque | Atténuation |
|-------|--------|-------------|
| Identifiants SSH | Divulgation | AES-256-GCM au repos ; déchiffrés uniquement pour les connexions |
| Cookie de session | Détournement | HTTPS, cookies HTTP-only, `BETTER_AUTH_SECRET` |
| Usurpation d'hôte | MITM sur SSH | Empreinte de clé hôte à la première connexion ; non vérifiée bloque l'application |
| Admin non autorisé | Force brute | Utilisateur unique ; limite de débit setup ; mots de passe robustes |
| CSRF / XSS | Abus de compte | Défauts du framework, CSP en production |
| Fichier export configuration | Fuite de secret | Mot de passe de réauthentification ; responsabilité opérateur |

L'application **n'implémente pas** d'ACL par serveur — tout admin connecté peut gérer tous les serveurs.

## Authentification

- Sessions e-mail/mot de passe Better Auth
- Inscription désactivée après le premier utilisateur (`/setup` une fois)
- Déconnexion efface la session ; connexion/déconnexion auditées

Exécuter uniquement en **HTTPS** en production (`APP_URL` doit utiliser https sauf localhost).

## Chiffrement au repos

| Secret | Clé |
|--------|-----|
| Mots de passe et clés d'identité | `APP_ENCRYPTION_KEY` (32 octets) |
| Signature de session | `BETTER_AUTH_SECRET` (min. 32 caractères en prod) |

Faire tourner `APP_ENCRYPTION_KEY` sans réimporter les identités rend le ciphertext stocké inutilisable.

## Exposition réseau

Compose production (`docker-compose.prod.yml`) :

- Postgres **non** publié sur l'hôte
- App écoute dans le réseau Docker pour NPM
- SSH cible depuis le conteneur app vers les serveurs gérés

TLS termine chez **Nginx Proxy Manager**. Le HTTP interne entre NPM et `ufw-app` est voulu — voir [Nginx Proxy Manager](../deployment/nginx-proxy-manager.md).

## Sécurité SSH

- Blocage par défaut des IP cibles privées/métadonnées
- `SSH_ALLOWED_CIDRS` optionnel pour lab/VPN
- TOFU clé hôte — voir [Serveurs et SSH](../concepts/servers-and-ssh.md)
- Application bloquée jusqu'à vérification de la clé hôte

## Durcissement application

En-têtes HTTP production (CSP, HSTS, etc.) via `next.config.ts`.

Le point de terminaison santé `/api/health` expose la version — pas de secrets.

## Audit

Les actions sensibles écrivent des lignes `auditEvent` : connexion, déconnexion, application, snapshot, scan de ports, export de configuration, modifications serveur. Voir [Journal d'audit et export](./audit-log-and-export.md).

## Réplique unique

Les limites de débit et les files d'attente sont **en mémoire**. Plusieurs répliques app sans état partagé affaiblissent les limites de débit et les garanties de file.

## Signaler des vulnérabilités

Voir [SECURITY.md](../../../SECURITY.md) à la racine du dépôt (anglais).

## Documentation associée

- [Variables d'environnement](./environment-variables.md)
- [Architecture](../architecture.md)
