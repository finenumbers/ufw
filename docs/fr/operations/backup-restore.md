# Sauvegarde et restauration

Tout l'état de l'application réside dans **PostgreSQL** (`ufw-postgres`, volume `ufw_postgres_data`). Les secrets d'exécution sont dans **`.env`** sur l'hôte.

## Quoi sauvegarder

| Élément | Requis pour reprise complète |
|---------|------------------------------|
| Dump Postgres | Oui |
| Fichier `.env` | Oui — `APP_ENCRYPTION_KEY` déchiffre les identifiants SSH |
| Export JSON de configuration | Copie de secours en clair optionnelle |

Ne commitez jamais les sauvegardes dans git.

## Trouver le volume

```bash
docker volume ls | grep ufw
docker inspect ufw-postgres --format '{{range .Mounts}}{{.Name}}{{end}}'
```

## Sauvegarde

### Script automatisé

```bash
BACKUP_DIR=/var/backups/ufw ENV_FILE=.env ./scripts/backup-postgres.sh
```

### Dump SQL manuel

```bash
docker exec ufw-postgres pg_dump -U ufw ufw | gzip > ufw-$(date +%F).sql.gz
install -m 600 .env env-$(date +%F).env
```

## Restauration

1. Arrêter l'application : `docker compose ... stop app`
2. Restaurer la base de données depuis le dump (voir les étapes détaillées dans le runbook legacy — recréer la BD si restauration propre nécessaire)
3. Restaurer le `.env` correspondant (même `APP_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`)
4. `docker compose ... up -d`
5. `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

Sans le `APP_ENCRYPTION_KEY` d'origine, resaisissez manuellement les secrets d'identité SSH ou restaurez depuis l'export de configuration en clair.

## Liste de contrôle reprise après sinistre

1. Restaurer `.env` depuis une sauvegarde sécurisée
2. Restaurer le dump Postgres
3. Confirmer que `ufw-migrate` exited 0
4. Connexion sur `APP_URL/login`
5. **Actualiser le statut** sur chaque tableau de bord serveur

## Documentation associée

- [Mise à niveau et retour arrière](./upgrade-rollback.md)
- [Import et export de configuration](../concepts/import-export-config.md)
