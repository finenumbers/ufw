# Sauvegarde et restauration

Protégez les **données PostgreSQL** et les **secrets `.env`**. Les règles UFW distantes sur les serveurs gérés ne sont pas stockées dans les sauvegardes sauf si capturées dans les snapshots à l'intérieur de la base de données.

## Quoi sauvegarder

| Élément | Contient |
|---------|----------|
| **Volume Postgres** | Utilisateurs, identités (chiffrées), serveurs, règles, snapshots, scans, audit |
| **Fichier `.env`** | `APP_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`, `POSTGRES_PASSWORD`, `APP_URL` |

Sans `.env`, les secrets d'identité chiffrés ne peuvent pas être déchiffrés après restauration.

Optionnel : export périodique [JSON v2 config](../concepts/import-export-config.md) comme copie de sinistre lisible (inclut secrets déchiffrés — chiffrer au repos).

## Sauvegarder Postgres

Trouver le volume :

```bash
docker volume ls | grep ufw
docker inspect ufw-postgres --format '{{range .Mounts}}{{.Name}}{{end}}'
```

Dump logique (recommandé) :

```bash
docker exec ufw-postgres pg_dump -U ufw ufw | gzip > ufw-$(date +%F).sql.gz
```

Stocker dump et `.env` dans des emplacements sécurisés séparés.

## Restaurer

1. Arrêter app : `docker compose ... stop app`
2. Restaurer la base de données (dans un volume Postgres vide ou neuf)
3. Restaurer `.env` avec la **même** `APP_ENCRYPTION_KEY` qu'au moment du chiffrement des données
4. `docker compose ... up -d`
5. Exécuter les [tests de fumée](./smoke-tests.md)

## Documentation associée

- [Import et export de configuration](../concepts/import-export-config.md)
- [Mise à niveau et retour arrière](./upgrade-rollback.md)
