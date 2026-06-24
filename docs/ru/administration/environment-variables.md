# Переменные окружения

Конфигурация runtime задаётся через `.env` (Compose) или UI переменных окружения Portainer. **Никогда не коммитьте реальные значения в git.**

## Обязательные (продакшен)

| Переменная | Описание | Генерация |
|------------|----------|-----------|
| `APP_URL` | Публичный HTTPS URL админ-интерфейса | Ваш домен NPM, например `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Пароль базы данных | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Секрет подписи сессий | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | AES-ключ для SSH-учётных данных (32 декодированных байта) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Имя Docker-сети, общей с NPM | `docker network ls` |

## Развёртывание GHCR

| Переменная | Описание |
|------------|----------|
| `GHCR_APP_IMAGE` | например, `ghcr.io/finenumbers/ufw-remote-manager:v0.1.0` |
| `GHCR_MIGRATE_IMAGE` | например, `ghcr.io/finenumbers/ufw-remote-manager-migrate:v0.1.0` |
| `IMAGE_TAG` | Тег для ссылок в документации/скриптах |
| `GHCR_OWNER` | Владелец GitHub (lowercase), например `finenumbers` |

## Опциональные

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `SSH_ALLOWED_CIDRS` | Разрешённые CIDR через запятую как SSH-цели | Пусто (частные IP блокируются) |
| `APP_BIND` | Адрес bind для локального compose | `127.0.0.1` |
| `APP_PORT` | Порт хоста для локального compose | `8088` |
| `POSTGRES_PORT` | Порт хоста для Postgres в dev | `5434` |
| `LOG_LEVEL` | Уровень логов Pino | `info` |

## Как переменные попадают в контейнеры

В `docker-compose.yml`:

```yaml
APP_URL: ${APP_URL:-http://localhost:8088}
BETTER_AUTH_URL: ${APP_URL:-http://localhost:8088}
```

Приложение читает `APP_URL` или `BETTER_AUTH_URL` во время выполнения (`getPublicAppUrl()`).

## Шаблоны и генераторы

- [`.env.example`](../../../.env.example) — локальная разработка
- [`.env.production.example`](../../../.env.production.example) — шаблон продакшена
- [`scripts/generate-production-env.sh`](../../../scripts/generate-production-env.sh) — интерактивный генератор

## Связанные документы

- [Модель безопасности](./security-model.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
