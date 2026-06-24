# GHCR + Docker Compose

Продакшен-образы публикуются в **GitHub Container Registry (GHCR)**:

| Образ | Назначение |
|-------|------------|
| `ghcr.io/finenumbers/ufw-remote-manager:TAG` | Next.js приложение |
| `ghcr.io/finenumbers/ufw-remote-manager-migrate:TAG` | Миграции Prisma (one-shot) |

Замените `finenumbers` на владельца вашего форка, если используете форк.

## Универсальные образы — APP_URL во время выполнения

Образы **не привязаны к домену**. Задайте `APP_URL` в `.env` на ваш публичный HTTPS URL. Сборка на каждый домен не требуется.

## Получение образов

### Вариант A — Git tag release (рекомендуется)

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions публикует образы с тегами. Пакеты должны быть **Public** при первом использовании (GitHub → Packages → settings).

### Вариант B — Release (dispatch)

Actions → **Release (dispatch)** → введите `image_tag` (например, `v0.1.0-prod`).

## Подготовка `.env` на сервере

```bash
cp .env.production.example .env
# or
./scripts/generate-production-env.sh .env
```

Пример:

```bash
APP_URL=https://ufw.example.com
NPM_NETWORK=nginxproxymanager_default
GHCR_OWNER=finenumbers
IMAGE_TAG=v0.1.0
GHCR_APP_IMAGE=ghcr.io/finenumbers/ufw-remote-manager:v0.1.0
GHCR_MIGRATE_IMAGE=ghcr.io/finenumbers/ufw-remote-manager-migrate:v0.1.0
POSTGRES_PASSWORD=...
BETTER_AUTH_SECRET=...
APP_ENCRYPTION_KEY=...
```

Генерация секретов:

```bash
openssl rand -base64 32   # BETTER_AUTH_SECRET, APP_ENCRYPTION_KEY
openssl rand -base64 24   # POSTGRES_PASSWORD
```

## Развёртывание

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.ghcr.yml \
  --env-file .env \
  pull

docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.ghcr.yml \
  --env-file .env \
  up -d
```

Проверка:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env config
```

Настройте NPM — см. [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Обновление

См. [Обновление и откат](../operations/upgrade-rollback.md).

## Устранение неполадок

| Симптом | Проверка |
|---------|----------|
| Циклы перенаправления auth | `APP_URL` точно совпадает с публичным URL NPM |
| `pull access denied` | Видимость пакета Public или `docker login ghcr.io` |
| `APP_URL is required` | `.env` загружен с `--env-file .env` |
| NPM 502 | Приложение в сети `npm_proxy`; имя контейнера `ufw-app` |

## Связанные документы

- [Обзор развёртывания](./overview.md)
- [Дымовые тесты](../operations/smoke-tests.md)
