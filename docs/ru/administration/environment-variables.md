# Переменные окружения

Конфигурация runtime задаётся через `.env` (Compose) или UI переменных окружения Portainer. **Никогда не коммитьте реальные значения в git.**

## Обязательные (продакшен)

| Переменная | Описание | Генерация |
|------------|----------|-----------|
| `APP_URL` | Публичный URL админ-интерфейса (HTTPS для реальных доменов) | Домен NPM, напр. `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Пароль базы данных | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Секрет подписи сессий (**мин. 32 символа** в продакшене) | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | AES-ключ для SSH-учётных данных (32 декодированных байта) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Имя Docker-сети, общей с NPM | `docker network ls` |

## Развёртывание GHCR (опционально)

Compose и Portainer stack по умолчанию используют `ghcr.io/finenumbers/ufw-remote-manager:latest`. Каждый GitHub release обновляет тег `latest`.

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `GHCR_OWNER` | Владелец GitHub (lowercase) | `finenumbers` |
| `GHCR_IMAGE_TAG` | Тег образа (`latest` или фиксация, напр. `v0.2.1`) | `latest` |

Устаревшие `GHCR_APP_IMAGE` / `GHCR_MIGRATE_IMAGE` / `IMAGE_TAG` больше не требуются — URL образов собираются из owner + tag в compose-файлах.

## Опциональные

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `SSH_ALLOWED_CIDRS` | Разрешённые CIDR через запятую как SSH-цели | Пусто (частные IP блокируются) |
| `TRUST_PROXY` | Задайте `1`, если приложение работает за Nginx Proxy Manager — rate limits `/setup` используют `X-Forwarded-For` | Не задано (forwarded headers игнорируются) |
| `APP_BIND` | Адрес bind для локального compose | `127.0.0.1` |
| `APP_PORT` | Порт хоста для локального compose | `8088` |
| `POSTGRES_PORT` | Порт хоста для Postgres в dev | `5434` |
| `LOG_LEVEL` | Уровень логов Pino | `info` |

## Rate limits (фиксированные)

Повторные действия на одном сервере имеют cooldown **30 секунд** (не настраивается через переменные окружения):

- Обновление статуса UFW и sync правил
- Запуск port scan
- Start, stop, restart Docker-контейнеров

С **v0.5.1** устаревшие переменные `PORT_SCAN_RATE_LIMIT_WINDOW_MS` **игнорируются**, если остались в `.env`.

In-memory buckets rate limit очищаются при опустошении (только single-replica — см. [Архитектура](../architecture.md)).

## APP_URL vs внутренний HTTP

Два разных URL для разных ролей:

| Настройка | Пример | Назначение |
|-----------|--------|------------|
| **`APP_URL`** | `https://ufw.example.com` | Публичный URL для Better Auth, cookies и редиректов браузера |
| **NPM Proxy Host scheme** | `http` → `ufw-app:8088` | Внутренний Docker-трафик; TLS завершает NPM |

**Не** указывайте `APP_URL` как внутренний URL контейнера. Better Auth требует публичный HTTPS-домен, который вводит пользователь.

В продакшене `APP_URL` должен быть **HTTPS** для реальных имён хостов. Исключения: `http://localhost` и `http://127.0.0.1` (локальные smoke-тесты и CI).

## Продакшен за NPM

Когда `ufw-app` за Nginx Proxy Manager в общей Docker-сети:

1. Задайте `TRUST_PROXY=1` в окружении приложения, чтобы rate limits `/setup` использовали IP клиента из `X-Forwarded-For` (NPM выставляет этот заголовок).
2. Без `TRUST_PROXY` лимиты setup используют один общий bucket (`direct`) — допустимо для local dev, не идеально для продакшена.

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
