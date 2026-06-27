# Copia de seguridad y restauración

Todo el estado de la aplicación reside en **PostgreSQL** (`ufw-postgres`, volumen `ufw_postgres_data`). Los secretos en tiempo de ejecución están en **`.env`** en el host.

## Qué respaldar

| Elemento | Necesario para recuperación completa |
|------|---------------------------|
| Volcado Postgres | Sí |
| Archivo `.env` | Sí — `APP_ENCRYPTION_KEY` descifra credenciales SSH |
| JSON de exportación de configuración | Copia de desastre opcional en texto plano |

Nunca suba copias de seguridad a git.

## Encontrar el volumen

```bash
docker volume ls | grep ufw
docker inspect ufw-postgres --format '{{range .Mounts}}{{.Name}}{{end}}'
```

## Copia de seguridad

### Script automatizado

```bash
BACKUP_DIR=/var/backups/ufw ENV_FILE=.env ./scripts/backup-postgres.sh
```

### Volcado SQL manual

```bash
docker exec ufw-postgres pg_dump -U ufw ufw | gzip > ufw-$(date +%F).sql.gz
install -m 600 .env env-$(date +%F).env
```

## Restauración

1. Detenga la aplicación: `docker compose ... stop app`
2. Restaure la base de datos desde el volcado (consulte pasos detallados en el runbook heredado — elimine/re cree BD si hace falta restauración limpia)
3. Restaure el `.env` coincidente (misma `APP_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`)
4. `docker compose ... up -d`
5. `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

Sin la `APP_ENCRYPTION_KEY` original, vuelva a introducir secretos de identidad SSH manualmente o restaure desde exportación de configuración en texto plano.

## Lista de comprobación de recuperación ante desastres

1. Restaure `.env` desde copia de seguridad segura
2. Restaure volcado Postgres
3. Confirme que `ufw-migrate` exited 0
4. Inicie sesión en `APP_URL/login`
5. **Actualizar estado** en cada panel de servidor

## Documentación relacionada

- [Actualización y reversión](./upgrade-rollback.md)
- [Importar y exportar configuración](../concepts/import-export-config.md)
