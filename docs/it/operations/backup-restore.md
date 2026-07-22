# Backup e ripristino

Proteggete i **dati PostgreSQL** e i **segreti `.env`**. Le regole UFW remote sui server gestiti non sono memorizzate nei backup salvo cattura negli snapshot dentro il database.

## Cosa fare backup

| Elemento | Contiene |
|------|----------|
| **Volume Postgres** | Utenti, identità (crittografate), server, regole, snapshot, scansioni, audit |
| **File `.env`** | `APP_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`, `POSTGRES_PASSWORD`, `APP_URL` |

Senza `.env`, i segreti identità crittografati non possono essere decifrati dopo il ripristino.

Opzionale: export [JSON v2 configurazione](../concepts/import-export-config.md) periodico come copia disaster human-readable (include segreti decifrati — crittografate a riposo).

## Backup Postgres

Trovate il volume:

```bash
docker volume ls | grep ufw
docker inspect ufw-postgres --format '{{range .Mounts}}{{.Name}}{{end}}'
```

Dump logico (consigliato):

```bash
docker exec ufw-postgres pg_dump -U ufw ufw | gzip > ufw-$(date +%F).sql.gz
```

Conservate dump e `.env` in posizioni sicure separate.

## Ripristino

1. Fermate app: `docker compose ... stop app`
2. Ripristinate database (in volume Postgres vuoto o fresco)
3. Ripristinate `.env` con la **stessa** `APP_ENCRYPTION_KEY` usata quando i dati erano crittografati
4. `docker compose ... up -d`
5. Eseguite [smoke test](./smoke-tests.md)

## Documenti correlati

- [Importazione ed esportazione configurazione](../concepts/import-export-config.md)
- [Aggiornamento e rollback](./upgrade-rollback.md)
