# Обзор развёртывания

Выберите, как запускать UFW Remote Manager в production. Все пути предполагают **HTTPS** через существующий reverse proxy (рекомендуется Nginx Proxy Manager).

![Схема развёртывания](../../assets/deploy-flow.svg)

## Сравнение

| Метод | Лучше всего для | Собирать образы? |
|-------|-----------------|------------------|
| [GHCR + Compose](./ghcr-compose.md) | Большинства self-hosters | Нет — pull из GitHub Packages |
| [Portainer](./portainer.md) | GUI-управления stack | Нет — pull образов GHCR |
| Локальная сборка Compose | Air-gapped или fork-разработки | Да — `docker compose build` |

Nginx Proxy Manager **всегда внешний** — не включён в этот репозиторий.

## Сервисы stack

| Контейнер | Назначение |
|-----------|------------|
| `ufw-postgres` | База данных |
| `ufw-migrate` | Выполняет миграции БД один раз за deploy |
| `ufw-app` | Веб-приложение (включает Naabu/Nmap при включённом сканировании портов) |

## Рекомендуемый production-путь

1. Pull тега образа **`latest`** (или зафиксировать напр. `v0.6.1`) из GHCR
2. Сгенерировать `.env` на сервере: `./scripts/generate-production-env.sh .env`
3. Развернуть с Compose + `docker-compose.prod.yml` + `docker-compose.ghcr.yml`
4. Настроить NPM Proxy Host → `ufw-app:8088`
5. Открыть `APP_URL/setup`, создать admin
6. Запустить `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`
7. Опционально: включить [внешнее сканирование портов](./port-scan.md) с `PORT_SCAN_ENABLED=true`
8. Опционально: включить [мониторинг Docker-контейнеров](./docker-monitor.md) с `DOCKER_MONITOR_ENABLED=true`

## Универсальные образы

Установите `APP_URL` в `.env` при deploy. Один и тот же GHCR-образ работает для любого домена — без сборки образа на клиента.

## Дисциплина секретов

- Генерировать секреты только на сервере
- Режим файла `600` для `.env`
- Никогда не хранить секреты в git-репозитории stack Portainer или публичных тикетах

## Связанная документация

- [Nginx Proxy Manager](./nginx-proxy-manager.md)
- [Переменные окружения](../administration/environment-variables.md)
- [Smoke-тесты](../operations/smoke-tests.md)
