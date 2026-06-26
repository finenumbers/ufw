# Обновление и откат

Стек: `ufw-postgres`, `ufw-migrate` (одноразовый), `ufw-app`. Образы универсальны — `APP_URL` задаётся в `.env` при запуске.

По умолчанию используется тег **`latest`** (обновляется при каждом GitHub release). Для обновления не нужно менять compose/stack файлы.

## Перед каждым обновлением

1. [Резервная копия](./backup-restore.md) Postgres и `.env`
2. Прочитайте [release notes](https://github.com/finenumbers/ufw/releases)

## Обновление (Portainer) — рекомендуется

1. Portainer → **Stacks** → `ufw-remote-manager` → **Update the stack**
2. Включите **Pull latest image**
3. Deploy (без изменений env, если `GHCR_IMAGE_TAG` не задан или `latest`)
4. Проверка: `ufw-migrate` exited 0, `ufw-app` healthy, smoke test

## Обновление (GHCR + Compose)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

Миграции выполняет `ufw-migrate` автоматически.

## Фиксация версии или откат

В `.env` или environment стека Portainer:

```bash
GHCR_IMAGE_TAG=v0.2.1
```

Затем pull и redeploy. Уберите `GHCR_IMAGE_TAG` (или задайте `latest`), чтобы снова получать последний релиз.

Миграции Prisma необратимы вперёд. Если новая версия применила необратимые изменения схемы — **восстановите Postgres из бэкапа**, а не только откатите тег образа.

## Смена APP_URL (перенос домена)

1. Обновите NPM Proxy Host
2. Измените `APP_URL` в `.env`
3. Redeploy или `docker compose ... up -d app`

Пересборка образа не нужна. Пользователям может потребоваться повторный вход.

## Связанные документы

- [Резервное копирование](./backup-restore.md)
- [Portainer](../deployment/portainer.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
