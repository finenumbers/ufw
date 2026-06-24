# Modèle de sécurité

Cette page explique comment UFW Remote Manager protège les identifiants, les sessions et les limites réseau.

Pour signaler une vulnérabilité, voir [SECURITY.md](../../../SECURITY.md) (anglais, référence).

## Authentification

- **Better Auth** avec e-mail/mot de passe
- Compte administrateur unique après la configuration initiale — pas d'inscription publique
- Cookies de session ; `BETTER_AUTH_SECRET` requis en production
- Limitation de débit sur les endpoints d'authentification (en mémoire, réplique unique)

## Chiffrement des identifiants

Les mots de passe SSH et clés privées sont chiffrés avec **AES-256-GCM** avant le stockage.

| Secret | Rôle |
|--------|------|
| `APP_ENCRYPTION_KEY` | Chiffre/déchiffre les secrets d'identité (32 octets, base64) |
| `BETTER_AUTH_SECRET` | Signe les jetons de session |

**Si `APP_ENCRYPTION_KEY` est perdu, les identifiants SSH chiffrés ne peuvent pas être récupérés** — seulement resaisis manuellement ou restaurés depuis une sauvegarde d'export de configuration.

## Sécurité SSH

- La validation de l'hôte bloque le SSRF vers les adresses privées/métadonnées
- `SSH_ALLOWED_CIDRS` optionnel pour les réseaux internes
- Épinglage de la clé hôte lors de la première connexion réussie
- Clés importées marquées non vérifiées jusqu'à un test SSH réussi
- Injection de commandes empêchée via des enums en liste blanche et construction de commandes UFW assainie

## Protections d'application et d'export

- Les modifications UFW exigent **aperçu + confirmation explicite**
- L'export de configuration exige une **resaisie du mot de passe** et écrit un événement d'audit `CONFIG_EXPORT`
- Les fichiers d'export contiennent des **secrets en clair** — responsabilité de l'opérateur

## En-têtes de sécurité HTTP (production)

Lorsque `NODE_ENV=production` :

- Content-Security-Policy
- Strict-Transport-Security (HSTS)
- X-Frame-Options, X-Content-Type-Options, Referrer-Policy

TLS se termine chez Nginx Proxy Manager ; l'application reçoit HTTP sur le réseau Docker.

## Liste de contrôle d'exposition réseau

- [ ] Interface admin uniquement via proxy inverse HTTPS
- [ ] Postgres non exposé à l'hôte/internet en production
- [ ] Restreindre l'URL admin (VPN, liste blanche IP dans NPM)
- [ ] Secrets `.env` robustes et uniques
- [ ] Sauvegardes régulières Postgres + `.env` hors site
- [ ] Rotation des secrets si export ou `.env` a pu fuiter

## Assainissement des erreurs

Les erreurs côté client des chemins SSH/application sont assainies pour éviter de divulguer des traces ou chemins internes.

## Documentation associée

- [Variables d'environnement](./environment-variables.md)
- [Journal d'audit et export](./audit-log-and-export.md)
- [Architecture](../architecture.md)
