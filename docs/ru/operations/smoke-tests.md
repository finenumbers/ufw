# Smoke-тесты

Запускать после deploy, обновления или disaster recovery.

## Автоматизированный скрипт

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url https://ufw.example.com
```

Флаги:

| Флаг | Назначение |
|------|------------|
| `--env-file .env` | Загрузить production variables (требует `NPM_NETWORK` для prod compose) |
| `--ghcr` | Включить overlay `docker-compose.ghcr.yml` |
| `--app-url URL` | Также проверить публичный HTTPS `/api/health` через curl |

Скрипт проверяет:

- Postgres healthy
- `ufw-migrate` exited 0
- `ufw-app` healthy
- Внутренний `/api/health` возвращает `{"status":"ok","db":"ok","version":"…"}` (`revision` только вне production)

## Ручная проверка health

```bash
docker compose --env-file .env ps
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

## Checklist браузера

1. `APP_URL/login` — аутентификация
2. **SSH Identities** — идентичность существует или создайте
3. **Servers** — тест SSH успешен
4. **Rules** — предпросмотр применения выполняется (подтверждение опционально)
5. **Operations history** — недавние записи видны

## Первая установка

Используйте `APP_URL/setup` вместо `/login` для однократного создания admin-аккаунта.

## Связанная документация

- [Первоначальная настройка](../user-guide/initial-setup.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
