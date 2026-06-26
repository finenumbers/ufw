# Мониторинг Docker-контейнеров

UFW Remote Manager может получать inventory и управлять **Docker-контейнерами** на каждом зарегистрированном сервере через **SSH** (тот же transport, что и для UFW).

Результаты отображаются в таблице **под блоком сканирования портов** на странице сервера.

## Включение

В окружении приложения (Compose / Portainer):

```env
DOCKER_MONITOR_ENABLED=true
```

Опциональные параметры:

| Переменная | По умолчанию | Назначение |
|------------|--------------|------------|
| `DOCKER_INVENTORY_HISTORY_LIMIT` | `10` | История snapshot inventory на сервер |
| `DOCKER_REFRESH_RATE_LIMIT_WINDOW_MS` | `120000` | Интервал между refresh inventory |
| `DOCKER_CONTROL_RATE_LIMIT_WINDOW_MS` | `300000` | Окно rate limit для start/stop/restart |
| `DOCKER_COMMAND_TIMEOUT_MS` | `60000` | Таймаут SSH-команд Docker CLI |

## Требования на managed-серверах

- Установлен **Docker CLI** (`docker` в PATH)
- Docker daemon доступен пользователю SSH
- Пользователь в группе **`docker`** или **passwordless sudo** для `docker`

Приложение сначала выполняет `docker …`, при permission denied — `sudo docker …`.

## Возможности (MVP)

- Refresh inventory: `docker ps -a`, stats для running-контейнеров
- Таблица: имя, образ, статус, health, порты, CPU/память, Compose labels
- Группировка по Compose project
- Drawer с деталями (`docker inspect`, маскирование секретов в env)
- Управление: **start**, **stop**, **restart** (подтверждение для stop/restart)
- Operation banner + audit events

## Безопасность

- Feature flag (по умолчанию выключен)
- Валидация container ID/name — без произвольных shell-команд
- Только фиксированные control actions
- Rate limits на refresh и control
- Audit: `DOCKER_INVENTORY_REFRESHED`, `DOCKER_CONTAINER_*`

## См. также

- [Обзор деплоя](./overview.md)
- [Модель безопасности](../administration/security-model.md)
