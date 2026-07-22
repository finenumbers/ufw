# Backup e restauração

Proteja **dados PostgreSQL** e **segredos do `.env`**. Regras UFW remotas em servidores gerenciados não são armazenadas em backups salvo se capturadas em snapshots dentro do banco.

## O que fazer backup

| Item | Contém |
|------|--------|
| **Volume Postgres** | Usuários, identidades (criptografadas), servidores, regras, snapshots, scans, auditoria |
| **Arquivo `.env`** | `APP_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`, `POSTGRES_PASSWORD`, `APP_URL` |

Sem `.env`, segredos de identidade criptografados não podem ser descriptografados após restore.

Opcional: [exportação JSON v2](../concepts/import-export-config.md) periódica como cópia legível de desastre (inclui segredos descriptografados — criptografe em repouso).

## Backup Postgres

Encontre o volume:

```bash
docker volume ls | grep ufw
docker inspect ufw-postgres --format '{{range .Mounts}}{{.Name}}{{end}}'
```

Dump lógico (recomendado):

```bash
docker exec ufw-postgres pg_dump -U ufw ufw | gzip > ufw-$(date +%F).sql.gz
```

Armazene dump e `.env` em locais seguros separados.

## Restaurar

1. Pare o app: `docker compose ... stop app`
2. Restaure o banco (em volume Postgres vazio ou novo)
3. Restaure `.env` com **mesmo** `APP_ENCRYPTION_KEY` de quando os dados foram criptografados
4. `docker compose ... up -d`
5. Execute [testes de fumaça](./smoke-tests.md)

## Documentos relacionados

- [Importar e exportar configuração](../concepts/import-export-config.md)
- [Atualização e rollback](./upgrade-rollback.md)
