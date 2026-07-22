# Dépannage

Symptôme → cause probable → correction. Pour les concepts, voir la documentation liée.

## Authentification et configuration

| Symptôme | Cause | Correction |
|----------|-------|------------|
| `/setup` redirige vers connexion | Utilisateur déjà existant | Utiliser `/login` |
| Échec de connexion après déploiement | `APP_URL` incorrect ou HTTP au lieu de HTTPS | Correspondre au domaine NPM ; définir `APP_URL=https://...` |
| Limite de débit setup trop agressive | `TRUST_PROXY` manquant derrière NPM | Définir `TRUST_PROXY=1` |

## SSH et création de serveur

| Symptôme | Cause | Correction |
|----------|-------|------------|
| IP privée rejetée | Validation d'hôte | Utiliser IP/nom d'hôte public ou `SSH_ALLOWED_CIDRS` |
| Connexion refusée | Pare-feu, mauvais port, hôte indisponible | Vérifier depuis l'hôte Docker : `ssh -p PORT user@host` |
| Échec d'authentification | Identifiants d'identité incorrects | Modifier l'identité ; ressaisir le secret |
| Avertissement clé hôte | Première connexion ou serveur reconstruit | **Actualiser le statut** pour capturer la nouvelle empreinte |

## UFW et règles

| Symptôme | Cause | Correction |
|----------|-------|------------|
| Application désactivée | Clé hôte non vérifiée | **Actualiser le statut** |
| Application rejetée après aperçu | UFW distant modifié | **Aperçu d'application** à nouveau |
| Application partielle | Commandes interrompues ou échec de sync | **Resynchronisation forcée depuis le serveur** ; consulter l'historique des opérations |
| Aperçu montre des suppressions inattendues | Dérive du brouillon | **Resynchronisation forcée depuis le serveur** |
| Règles réapparaissent après suppression sur le serveur | Sync obsolète (pré-v0.9.2) | Mettre à niveau vers v0.9.2+ ; resync forcée |
| Verrouillé hors SSH | Règle deny appliquée | Accès console ; corriger UFW hors bande |

## Bannière d'opérations

| Symptôme | Cause | Correction |
|----------|-------|------------|
| Bannière EN COURS indéfiniment | Navigateur déconnecté en cours d'opération | Actualiser la page ; attendre le nettoyeur |
| Tableau obsolète après sync | Fin d'opération non détectée (rare post-v0.9.2) | Actualiser le navigateur |
| Trafic API inactif | Ancienne version pollait indéfiniment | Mettre à niveau v0.9.2 — le poll inactif s'arrête |

## Scan de ports

| Symptôme | Cause | Correction |
|----------|-------|------------|
| Panneau absent | Fonctionnalité désactivée | `PORT_SCAN_ENABLED=true` |
| Échec de scan timeout | Plage de ports large / réseau lent | Augmenter `PORT_SCAN_*_TIMEOUT_MS` ; vérifier la sortie |
| Erreur scan en cours | Garde de chevauchement | Attendre le scan actuel |
| Aucun résultat | Tous les ports filtrés/fermés | Attendu ; vérifier statut SUCCESS du scan |
| Progression perdue à l'actualisation (ancien) | SSR ne chargeait que les scans SUCCESS | Mettre à niveau v0.9.2 |

## Docker et migrate

| Symptôme | Cause | Correction |
|----------|-------|------------|
| `EACCES` prisma dans app | Mauvais conteneur | `docker compose run --rm migrate` |
| Échec migrate à la mise à niveau | Permissions BD ou ancienne version | Vérifier `docker compose logs migrate` |
| App unhealthy | Secrets incorrects ou BD indisponible | Logs : `docker compose logs app` |

## Import/export de configuration

| Symptôme | Cause | Correction |
|----------|-------|------------|
| Import bloqué | Opérations actives sur le serveur | Attendre que la file soit inactive |
| Export limité en débit | Trop de tentatives | Attendre 60 secondes |
| Secrets déchiffrés illisibles après restauration | `APP_ENCRYPTION_KEY` incorrect | Restaurer le `.env` correspondant |

## Documentation associée

- [FAQ](./faq.md)
- [Opérations et concurrence](./concepts/operations-and-concurrency.md)
- [Variables d'environnement](./administration/environment-variables.md)
