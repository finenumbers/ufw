# GHCR + Docker Compose

Production-образы публикуются в **GitHub Container Registry (GHCR)**:

| Образ | Назначение |
|-------|------------|
| `ghcr.io/finenumbers/ufw-remote-manager:TAG` | Next.js-приложение |
| `ghcr.io/finenumbers/ufw-remote-manager-migrate:TAG` | Prisma-миграции (одноразовый запуск) |

Каждый release публикует **`latest`** плюс version tags (напр. `v0.6.1`, `0.6.1`). Production deploys по умолчанию используют **`latest`** — версия в `.env` не требуется.

Замените `finenumbers` на владельца вашего fork при использовании fork (`GHCR_OWNER` в `.env`).

## Универсальные образы — APP_URL в runtime

Образы **не привязаны к домену**. Установите `APP_URL` в `.env` на ваш публичный HTTPS URL. Сборка на домен не требуется.

## Получение образов

### Вариант A — Release по Git tag (рекомендуется)

```bash
git tag v0.7.0
git push origin v0.7.0
```

GitHub Actions публикует tagged images и обновляет `latest`. Пакеты должны быть **Public** при первом использовании (GitHub → Packages → settings).

### Вариант B — Release (dispatch)

Actions → **Release (dispatch)** → ввести `image_tag` (пользовательский tag; не обновляет `latest`, если вы вручную не тегируете `latest`).

## Подготовка `.env` на сервере

```bash
cp .env.production.example .env
# or
./scripts/generate-production-env.sh .env
```

Пример (секреты обязательны; image vars опциональны):

```bash
APP_URL=https://ufw.example.com
NPM_NETWORK=nginxproxymanager_default
POSTGRES_PASSWORD=...
BETTER_AUTH_SECRET=...
APP_ENCRYPTION_KEY=...
# Optional: GHCR_OWNER=finenumbers  GHCR_IMAGE_TAG=latest
```

Генерация секретов:

```bash
openssl rand -base64 32   # BETTER_AUTH_SECRET, APP_ENCRYPTION_KEY
openssl rand -base64 24   # POSTGRES_PASSWORD
```

## Deploy

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

Настройка NPM — см. [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Обновление

Redeploy с `docker compose ... pull && up -d` — без изменений `.env` при использовании `latest`.

См. [Обновление и rollback](../operations/upgrade-rollback.md) для фиксации версии.

## Устранение неполадок

| Симптом | Проверить |
|---------|-----------|
| Циклы редиректа auth | `APP_URL` точно совпадает с публичным URL NPM |
| `pull access denied` | Видимость пакета Public или `docker login ghcr.io` |
| `APP_URL is required` | `.env` загружен с `--env-file .env` |
| NPM 502 | App в сети `npm_proxy`; имя контейнера `ufw-app` |

## Связанная документация

- [Обзор развёртывания](./overview.md)
- [Smoke-тесты](../operations/smoke-tests.md)
