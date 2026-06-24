# Дымовые тесты

Запускайте после развёртывания, обновления или аварийного восстановления.

## Автоматический скрипт

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url https://ufw.example.com
```

Флаги:

| Флаг | Назначение |
|------|------------|
| `--env-file .env` | Загрузка продакшен-переменных (требует `NPM_NETWORK` для prod compose) |
| `--ghcr` | Включить overlay `docker-compose.ghcr.yml` |
| `--app-url URL` | Также проверить публичный HTTPS `/api/health` через curl |

Скрипт проверяет:

- Postgres healthy
- `ufw-migrate` exited 0
- `ufw-app` healthy
- Внутренний `/api/health` возвращает `{"status":"ok","db":"ok"}`

## Ручная проверка health

```bash
docker compose --env-file .env ps
docker exec ufw-app node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>r.json()).then(console.log)"
```

## Чеклист в браузере

1. `APP_URL/login` — аутентификация
2. **SSH-идентификации** — идентификация существует или создайте новую
3. **Серверы** — проверка SSH успешна
4. **Правила** — предпросмотр применения выполняется (подтверждение опционально)
5. **История операций** — видны недавние записи

## Первая установка

Используйте `APP_URL/setup` вместо `/login` для однократного создания учётной записи администратора.

## Связанные документы

- [Первоначальная настройка](../user-guide/initial-setup.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
