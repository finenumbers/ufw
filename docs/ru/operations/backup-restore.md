# Резервное копирование и восстановление

Всё состояние приложения хранится в **PostgreSQL** (`ufw-postgres`, volume `ufw_postgres_data`). Секреты runtime — в **`.env`** на хосте.

## Что резервировать

| Элемент | Нужен для полного восстановления |
|---------|----------------------------------|
| Дамп Postgres | Да |
| Файл `.env` | Да — `APP_ENCRYPTION_KEY` расшифровывает SSH-учётные данные |
| Экспорт конфигурации JSON | Опциональная аварийная копия в открытом виде |

Никогда не коммитьте резервные копии в git.

## Найти volume

```bash
docker volume ls | grep ufw
docker inspect ufw-postgres --format '{{range .Mounts}}{{.Name}}{{end}}'
```

## Резервное копирование

### Автоматический скрипт

```bash
BACKUP_DIR=/var/backups/ufw ENV_FILE=.env ./scripts/backup-postgres.sh
```

### Ручной SQL dump

```bash
docker exec ufw-postgres pg_dump -U ufw ufw | gzip > ufw-$(date +%F).sql.gz
install -m 600 .env env-$(date +%F).env
```

## Восстановление

1. Остановите приложение: `docker compose ... stop app`
2. Восстановите базу данных из дампа (подробные шаги в legacy runbook — drop/recreate DB при необходимости чистого восстановления)
3. Восстановите соответствующий `.env` (тот же `APP_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`)
4. `docker compose ... up -d`
5. `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

Без исходного `APP_ENCRYPTION_KEY` повторно введите секреты SSH-идентификаций вручную или восстановите из экспорта конфигурации в открытом виде.

## Чеклист аварийного восстановления

1. Восстановите `.env` из защищённой резервной копии
2. Восстановите дамп Postgres
3. Убедитесь, что `ufw-migrate` exited 0
4. Войдите на `APP_URL/login`
5. Проверка SSH на каждом сервере

## Связанные документы

- [Обновление и откат](./upgrade-rollback.md)
- [Импорт и экспорт конфигурации](../concepts/import-export-config.md)
