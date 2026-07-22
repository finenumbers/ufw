# Smoke-тесты

Run after deploy, upgrade, or disaster recovery.

## Automated script

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url https://ufw.example.com
```

| Flag | Purpose |
|------|---------|
| `--env-file .env` | Load production variables |
| `--ghcr` | Include `docker-compose.ghcr.yml` |
| `--app-url URL` | Check public HTTPS `/api/health` |

Verifies: Postgres healthy, migrate exited 0, app healthy, health JSON includes version.

## Manual health check

```bash
docker compose --env-file .env ps
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

## Browser checklist

1. `APP_URL/login` — authenticate
2. **SSH-идентификации** — create or verify identity
3. **Серверы** — create/update; SSH verification succeeds
4. **Обновить статус** — UFW snapshot created
5. **Rules** — apply preview runs; optional confirm on test server
6. **История операций** — recent entries visible
7. **Initial sync** — new server without snapshot gets background sync
8. **Port scan** (if enabled) — start scan; refresh page mid-scan — panel resumes (v0.9.2)
9. **Apply** — after confirm, rule count matches remote

## First install

Use `APP_URL/setup` once to create admin account.

## Связанные документы

- [Первоначальная настройка](../user-guide/initial-setup.md)
- [Управление серверами](../user-guide/manage-servers.md)
