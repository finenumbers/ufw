# Mise à niveau et retour arrière

## Mise à niveau (recommandée)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

Le service **migrate** exécute `prisma migrate deploy` automatiquement.

Vérifier :

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

## Notes de version

| Version | Migration | Changements notables |
|---------|-----------|---------------------|
| **v0.9.0** | Oui — supprime les tables d'inventaire legacy | Interface inventaire legacy supprimée |
| **v0.9.1** | Non | Nettoyage legacy, garde-fous documentation |
| **v0.9.2** | Non | Correction sync application, cycle de vie bannière opérations, scan de ports hors file SSH, garde chevauchement |

Lors de la mise à niveau depuis pré-v0.9.0, s'assurer que migrate se termine — données inventaire legacy purgées.

Épingler l'image : `GHCR_IMAGE_TAG=v0.9.5` dans `.env`.

## Retour arrière

1. Définir `GHCR_IMAGE_TAG` sur le tag précédent connu bon
2. `docker compose ... pull && up -d`
3. Si migration déjà appliquée forward-only, restauration d'une sauvegarde BD plus ancienne peut être requise — tester le retour arrière en staging

Les migrations base de données ne sont généralement **pas** inversées automatiquement.

## Zéro interruption

Application mono-conteneur — attendre un bref redémarrage pendant `up -d`. Planifier une fenêtre de maintenance pour la production.

## Documentation associée

- [GHCR + Compose](../deployment/ghcr-compose.md)
- [Sauvegarde et restauration](./backup-restore.md)
