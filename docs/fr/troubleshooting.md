# Dépannage

Symptôme → cause probable → que faire.

## Authentification

| Symptôme | Cause | Correction |
|----------|-------|------------|
| Boucle de redirection à la connexion | `APP_URL` ne correspond pas à l'URL du navigateur | Définir `APP_URL` sur l'URL HTTPS publique exacte ; redémarrer l'application |
| Connexion OK en local mais pas via le domaine | NPM ou drapeau cookie secure | Forcer SSL dans NPM ; vérifier que le schéma de `APP_URL` est `https://` |
| `BETTER_AUTH_SECRET is required` | `.env` non chargé | Utiliser `--env-file .env` dans compose |

## Docker / NPM

| Symptôme | Cause | Correction |
|----------|-------|------------|
| NPM 502 Bad Gateway | Application hors réseau NPM | Définir `NPM_NETWORK` ; vérifier que `ufw-app` rejoint le réseau externe |
| `ufw-app` unhealthy | BD indisponible ou secrets manquants | Vérifier `docker logs ufw-app`, santé postgres |
| `ufw-migrate` failed | Erreur de migration | Lire `docker logs ufw-migrate` ; restaurer une sauvegarde si nécessaire |
| `pull access denied` | Package GHCR privé | Rendre le package Public ou `docker login ghcr.io` |

## SSH

| Symptôme | Cause | Correction |
|----------|-------|------------|
| Échec du test SSH | Identifiants incorrects, pare-feu, hôte indisponible | Vérifier l'identité, le port, que le serveur autorise l'IP de l'hôte Docker |
| Erreur de validation de l'hôte | IP privée bloquée | Définir `SSH_ALLOWED_CIDRS` pour les réseaux internes |
| Clé hôte modifiée | Réinstallation serveur ou MITM | Vérifier l'empreinte sur le serveur ; mettre à jour après confirmation |
| Clé hôte non vérifiée | Importée depuis la configuration | Lancer un test SSH depuis la page de modification du serveur |

## Règles / application

| Symptôme | Cause | Correction |
|----------|-------|------------|
| Page Règles vide / désactivée | UFW inactif | Installer et activer UFW depuis le tableau de bord |
| L'aperçu montre des suppressions inattendues | Dérive du brouillon | Resynchronisation forcée depuis le serveur |
| Avertissement d'application partielle | Application précédente interrompue | Resynchroniser ; vérifier `ufw status` à distance manuellement |
| Verrouillage SSH | Règle deny appliquée | Accès console/hors bande ; corriger UFW sur le serveur directement |

## Données

| Symptôme | Cause | Correction |
|----------|-------|------------|
| Identifiants invalides après restauration | Mauvais `APP_ENCRYPTION_KEY` | Restaurer le `.env` correspondant depuis la sauvegarde |
| Impossible de déchiffrer les identités | Rotation de clé sans resaisie | Resaisir les secrets ou restaurer l'export JSON |

## API Health

```bash
docker exec ufw-app node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>r.json()).then(console.log)"
```

Attendu : `{"status":"ok","db":"ok"}`

## Toujours bloqué ?

Envoyez un e-mail à **[apps@finenumbers.com](mailto:apps@finenumbers.com)** avec la version, des journaux assainis (sans secrets) et les étapes de reproduction.
