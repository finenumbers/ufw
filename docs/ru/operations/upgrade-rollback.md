# Обновление и откат

Стек: `ufw-postgres`, `ufw-migrate` (one-shot), `ufw-app`. Образы универсальны — задайте `APP_URL` в `.env` во время выполнения.

## Перед каждым обновлением

1. [Резервная копия](./backup-restore.md) Postgres и `.env`
2. Запишите текущий тег образа: `grep IMAGE_TAG .env`
3. Прочитайте [release notes](https://github.com/finenumbers/ufw/releases)

## Обновление (GHCR + Compose)

1. Обновите `.env`:

```bash
IMAGE_TAG=v0.2.0
GHCR_APP_IMAGE=ghcr.io/finenumbers/ufw-remote-manager:v0.2.0
GHCR_MIGRATE_IMAGE=ghcr.io/finenumbers/ufw-remote-manager-migrate:v0.2.0
```

2. Загрузите и переразверните:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

3. Проверка: `docker logs ufw-migrate` (exit 0) и `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

Миграции выполняются автоматически через `ufw-migrate`.

## Обновление (Portainer)

Обновите `GHCR_*_IMAGE` в переменных окружения стека → **Update the stack** (Pull & redeploy).

## Откат

Миграции Prisma только вперёд. Если новая версия применила необратимые изменения схемы, **восстановите Postgres из резервной копии до обновления** — не откатывайте только тег образа.

Безопасный откат только образа (без деструктивной миграции):

1. Верните теги образов в `.env` на предыдущую версию
2. `docker compose ... pull && docker compose ... up -d`
3. Дымовой тест

## Смена APP_URL (перенос домена)

1. Обновите NPM Proxy Host
2. Измените `APP_URL` в `.env`
3. `docker compose ... up -d app`

Пересборка образа не требуется. Пользователям может понадобиться войти снова.

## Связанные документы

- [Резервное копирование и восстановление](./backup-restore.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
