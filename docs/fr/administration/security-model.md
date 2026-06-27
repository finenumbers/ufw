# Modèle de sécurité

Cette page explique comment UFW Remote Manager protège les identifiants, les sessions et les limites réseau.

Pour signaler une vulnérabilité, voir [SECURITY.md](../../../SECURITY.md) (anglais, référence canonique).

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

- La validation de l'hôte bloque le SSRF vers les adresses privées/métadonnées à l'enregistrement
- **Vérification de résolution DNS :** avant chaque connexion SSH et scan de ports, l'IP résolue est validée à nouveau — bloque le DNS rebinding vers des adresses privées/métadonnées même lorsque le nom d'hôte semblait sûr à l'enregistrement
- `SSH_ALLOWED_CIDRS` optionnel pour les réseaux internes
- Épinglage de la clé hôte lors de la première connexion réussie
- Clés importées marquées non vérifiées jusqu'à un test SSH réussi
- Injection de commandes empêchée via des enums en liste blanche et construction de commandes UFW assainie

## Scan de ports externe (optionnel)

Lorsque `PORT_SCAN_ENABLED=true` :

- Les scans s'exécutent **uniquement** vers les enregistrements `Server.host` déjà en base de données
- Naabu + Nmap s'exécutent dans `ufw-app` (scans connect, pas de cibles arbitraires)
- Limité par serveur ; événements d'audit enregistrés
- Nécessite une **sortie réseau** du conteneur application vers les hôtes gérés sur les ports scannés — voir [Scan de ports](../deployment/port-scan.md)

## Surveillance Docker (optionnel)

Lorsque `DOCKER_MONITOR_ENABLED=true` :

- L'inventaire et le contrôle s'exécutent via **SSH** sur les serveurs enregistrés uniquement
- Références de conteneurs validées ; actions `START` / `STOP` / `RESTART` uniquement
- Limites de débit et événements d'audit sur actualisation et contrôle
- L'utilisateur SSH a besoin de l'accès CLI Docker — voir [Surveillance Docker](../deployment/docker-monitor.md)

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

### Note sur Content-Security-Policy

La CSP actuelle inclut `'unsafe-inline'` et `'unsafe-eval'` pour les scripts Next.js App Router et l'hydratation. La CSP basée sur les nonces est reportée jusqu'à ce que Next.js la prenne en charge sans casser les bundles client. Ne supprimez pas ces directives sans une passe de régression complète.

## Endpoints publics

| Chemin | Auth | Notes |
|--------|------|-------|
| `/api/health` | Aucune | Retourne `status`, `db`, `version` ; `revision` (id git/build) uniquement en non-production |
| `/setup` | Aucune (une fois) | Limité en débit ; utiliser `TRUST_PROXY=1` derrière NPM |

## Limitation de débit du setup

L'enregistrement administrateur initial (`/setup`) est limité à **5 tentatives par minute** par IP client lorsque `TRUST_PROXY=1`, sinon par bucket de connexion directe.

## Liste de contrôle d'exposition réseau

- [ ] Interface admin uniquement via proxy inverse HTTPS
- [ ] Postgres non exposé à l'hôte/internet en production
- [ ] Restreindre l'URL admin (VPN, liste blanche IP dans NPM)
- [ ] Secrets `.env` robustes et uniques
- [ ] Sauvegardes régulières Postgres + `.env` hors site
- [ ] Rotation des secrets si export ou `.env` a pu fuiter

## Assainissement des erreurs

Les erreurs côté client des chemins SSH/application sont assainies pour éviter de divulguer des traces ou chemins internes.

Les sessions expirées renvoient un message cohérent depuis les server actions : `Session expired. Please sign in again.` (pas de `Unauthorized` brut propagé à l'interface).

## Documentation associée

- [Variables d'environnement](./environment-variables.md)
- [Journal d'audit et export](./audit-log-and-export.md)
- [Architecture](../architecture.md)
