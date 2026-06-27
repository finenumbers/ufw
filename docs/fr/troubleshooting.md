# Dépannage

Symptôme → cause probable → action.

## Authentification

| Symptôme | Cause | Solution |
|----------|-------|----------|
| Boucle de redirection à la connexion | `APP_URL` ne correspond pas à l'URL du navigateur | Définir `APP_URL` sur l'URL HTTPS publique exacte ; redémarrer l'app |
| Connexion OK en local mais pas via le domaine | NPM ou flag cookie secure | Forcer SSL dans NPM ; vérifier que le schéma `APP_URL` est `https://` |
| `BETTER_AUTH_SECRET is required` | `.env` non chargé | Utiliser `--env-file .env` dans compose |
| `APP_URL must use HTTPS in production` | `APP_URL` non HTTPS pour un vrai domaine | Utiliser `https://your-domain` ; `http://localhost` autorisé pour smoke/CI uniquement |
| `BETTER_AUTH_SECRET must be at least 32 characters` | Secret trop court | Régénérer avec `openssl rand -base64 32` |

## Docker / NPM

| Symptôme | Cause | Solution |
|----------|-------|----------|
| NPM 502 Bad Gateway | App pas sur le réseau NPM | Définir `NPM_NETWORK` ; vérifier que `ufw-app` rejoint le réseau externe |
| Page setup facile à brute-forcer | `TRUST_PROXY` manquant | Définir `TRUST_PROXY=1` derrière NPM |
| `ufw-app` unhealthy | BD down ou secrets manquants | Vérifier `docker logs ufw-app`, santé postgres |
| `ufw-migrate` échoué | Erreur de migration | Lire `docker logs ufw-migrate` ; restaurer la sauvegarde si nécessaire |
| `pull access denied` | Package GHCR privé | Visibilité Public ou `docker login ghcr.io` |

## SSH

| Symptôme | Cause | Solution |
|----------|-------|----------|
| Test SSH échoué | Mauvais identifiants, pare-feu, hôte down | Vérifier identité, port ; le serveur autorise l'IP de l'hôte Docker |
| Erreur de validation d'hôte | IP privée bloquée | Définir `SSH_ALLOWED_CIDRS` pour les réseaux internes |
| Clé hôte modifiée | Réinstallation serveur ou MITM | Vérifier l'empreinte sur le serveur ; mettre à jour après confirmation |
| Clé hôte non vérifiée | Importée depuis la config | Exécuter le test SSH depuis la page de modification du serveur |

## Règles / application

| Symptôme | Cause | Solution |
|----------|-------|----------|
| Page règles vide / désactivée | UFW non actif | Installer et activer UFW depuis le tableau de bord |
| Aperçu montre des suppressions inattendues | Dérive du brouillon | Resynchronisation forcée depuis le serveur |
| Application rejetée — distant modifié | UFW modifié entre aperçu et confirmation | Relancer **Aperçu d'application** (pas resync) |
| Avertissement application partielle | Application précédente interrompue ou sync échouée | Resynchroniser ; examiner `ufw status` distant manuellement |
| Bannière d'opération bloquée | RUNNING/PENDING obsolète après déconnexion | Actualiser la page |
| Exclusion SSH | Règle deny appliquée | Accès console/hors bande ; corriger UFW directement sur le serveur |

## Données

| Symptôme | Cause | Solution |
|----------|-------|----------|
| Identifiants invalides après restauration | Mauvais `APP_ENCRYPTION_KEY` | Restaurer le `.env` correspondant depuis la sauvegarde |
| Impossible de déchiffrer les identités | Rotation de clé sans ressaisie | Resaisir les secrets ou restaurer l'export JSON |

## API Health

```bash
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

Attendu : `{"status":"ok","db":"ok","version":"…"}` (`revision` uniquement hors production)

## Toujours bloqué ?

Envoyez un e-mail à **[apps@finenumbers.com](mailto:apps@finenumbers.com)** avec le tag de version, des logs assainis (sans secrets) et les étapes de reproduction.
