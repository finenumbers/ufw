# Backup e restauração

Todo o estado da aplicação fica no **PostgreSQL** (`ufw-postgres`, volume `ufw_postgres_data`). Segredos em tempo de execução ficam no **`.env`** no host.

## O que fazer backup

| Item | Necessário para recuperação completa |
|------|---------------------------|
| Dump do Postgres | Sim |
| Arquivo `.env` | Sim — `APP_ENCRYPTION_KEY` descriptografa credenciais SSH |
| JSON de exportação de configuração | Cópia de desastre opcional em texto plano |

Nunca faça commit de backups no git.

## Encontrar o volume

```bash
docker volume ls | grep ufw
docker inspect ufw-postgres --format '{{range .Mounts}}{{.Name}}{{end}}'
```

## Backup

### Script automatizado

```bash
BACKUP_DIR=/var/backups/ufw ENV_FILE=.env ./scripts/backup-postgres.sh
```

### Dump SQL manual

```bash
docker exec ufw-postgres pg_dump -U ufw ufw | gzip > ufw-$(date +%F).sql.gz
install -m 600 .env env-$(date +%F).env
```

## Restaurar

1. Pare a app: `docker compose ... stop app`
2. Restaure o banco de dados a partir do dump (veja passos detalhados no runbook legado — drop/recreate do BD se precisar de restauração limpa)
3. Restaure o `.env` correspondente (mesmo `APP_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`)
4. `docker compose ... up -d`
5. `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

Sem o `APP_ENCRYPTION_KEY` original, reinsira os segredos de identidade SSH manualmente ou restaure a partir da exportação de configuração em texto plano.

## Checklist de recuperação de desastre

1. Restaure `.env` a partir de backup seguro
2. Restaure dump do Postgres
3. Confirme que `ufw-migrate` exited 0
4. Login em `APP_URL/login`
5. Testar SSH em cada servidor

## Documentação relacionada

- [Atualização e rollback](./upgrade-rollback.md)
- [Importar e exportar configuração](../concepts/import-export-config.md)
