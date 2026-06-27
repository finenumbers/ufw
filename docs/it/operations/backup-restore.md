# Backup e ripristino

Tutto lo stato dell'applicazione risiede in **PostgreSQL** (`ufw-postgres`, volume `ufw_postgres_data`). I segreti di runtime risiedono in **`.env`** sull'host.

## Cosa eseguire backup

| Elemento | Obbligatorio per ripristino completo |
|------|---------------------------|
| Dump Postgres | Sì |
| File `.env` | Sì — `APP_ENCRYPTION_KEY` decrittografa credenziali SSH |
| Export configurazione JSON | Copia disaster opzionale in testo chiaro |

Non committare mai i backup in git.

## Trovare il volume

```bash
docker volume ls | grep ufw
docker inspect ufw-postgres --format '{{range .Mounts}}{{.Name}}{{end}}'
```

## Backup

### Script automatizzato

```bash
BACKUP_DIR=/var/backups/ufw ENV_FILE=.env ./scripts/backup-postgres.sh
```

### Dump SQL manuale

```bash
docker exec ufw-postgres pg_dump -U ufw ufw | gzip > ufw-$(date +%F).sql.gz
install -m 600 .env env-$(date +%F).env
```

## Ripristino

1. Ferma app: `docker compose ... stop app`
2. Ripristina database dal dump (vedi passi dettagliati nel runbook legacy — drop/ricrea DB se serve ripristino pulito)
3. Ripristina `.env` corrispondente (stessa `APP_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`)
4. `docker compose ... up -d`
5. `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

Senza la `APP_ENCRYPTION_KEY` originale, reinserisci manualmente i segreti identità SSH o ripristina da export configurazione in testo chiaro.

## Checklist disaster recovery

1. Ripristina `.env` da backup sicuro
2. Ripristina dump Postgres
3. Conferma che `ufw-migrate` esca con 0
4. Accedi su `APP_URL/login`
5. **Aggiorna stato** su ogni dashboard server

## Documentazione correlata

- [Aggiornamento e rollback](./upgrade-rollback.md)
- [Importazione ed esportazione configurazione](../concepts/import-export-config.md)
