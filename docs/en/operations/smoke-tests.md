# Smoke tests

Run after deploy, upgrade, or disaster recovery.

## Automated script

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url https://ufw.example.com
```

Flags:

| Flag | Purpose |
|------|---------|
| `--env-file .env` | Load production variables (requires `NPM_NETWORK` for prod compose) |
| `--ghcr` | Include `docker-compose.ghcr.yml` overlay |
| `--app-url URL` | Also check public HTTPS `/api/health` via curl |

The script verifies:

- Postgres healthy
- `ufw-migrate` exited 0
- `ufw-app` healthy
- Internal `/api/health` returns `{"status":"ok","db":"ok"}`

## Manual health check

```bash
docker compose --env-file .env ps
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

## Browser checklist

1. `APP_URL/login` — authenticate
2. **SSH Identities** — identity exists or create one
3. **Servers** — SSH test succeeds
4. **Rules** — apply preview runs (confirm optional)
5. **Operations history** — recent entries visible

## First install

Use `APP_URL/setup` instead of `/login` to create the admin account once.

## Related docs

- [Initial setup](../user-guide/initial-setup.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
