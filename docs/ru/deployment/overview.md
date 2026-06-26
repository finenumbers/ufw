# Обзор развёртывания

Выберите способ запуска UFW Remote Manager в продакшене. Все пути предполагают **HTTPS** через существующий reverse proxy (рекомендуется Nginx Proxy Manager).

![Поток развёртывания](../../assets/deploy-flow.svg)

## Сравнение

| Метод | Лучше всего для | Сборка образов? |
|-------|-----------------|-----------------|
| [GHCR + Compose](./ghcr-compose.md) | Большинства self-hosters | Нет — загрузка из GitHub Packages |
| [Portainer](./portainer.md) | GUI-управления стеком | Нет — загрузка образов GHCR |
| Локальная сборка Compose | Air-gapped или разработка форка | Да — `docker compose build` |

Nginx Proxy Manager **всегда внешний** — не включён в этот репозиторий.

## Сервисы стека

| Контейнер | Назначение |
|-----------|------------|
| `ufw-postgres` | База данных |
| `ufw-migrate` | Выполняет миграции БД один раз при каждом развёртывании |
| `ufw-app` | Веб-приложение (Naabu/Nmap при включённом port scan) |

## Рекомендуемый путь для продакшена

1. Загрузите тег образа `v0.1.0` (или последний релиз) из GHCR
2. Сгенерируйте `.env` на сервере: `./scripts/generate-production-env.sh .env`
3. Разверните с Compose + `docker-compose.prod.yml` + `docker-compose.ghcr.yml`
4. Настройте NPM Proxy Host → `ufw-app:8088`
5. Откройте `APP_URL/setup`, создайте администратора
6. Выполните `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`
7. Опционально: [внешнее сканирование портов](./port-scan.md) — `PORT_SCAN_ENABLED=true`
8. Опционально: [мониторинг Docker-контейнеров](./docker-monitor.md) — `DOCKER_MONITOR_ENABLED=true`

## Универсальные образы

Задайте `APP_URL` в `.env` при развёртывании. Один и тот же образ GHCR работает для любого домена — без сборки образа на каждого клиента.

## Дисциплина секретов

- Генерируйте секреты только на сервере
- Права файла `600` для `.env`
- Никогда не храните секреты в git-репозитории стека Portainer или публичных тикетах

## Связанные документы

- [Nginx Proxy Manager](./nginx-proxy-manager.md)
- [Переменные окружения](../administration/environment-variables.md)
- [Дымовые тесты](../operations/smoke-tests.md)
