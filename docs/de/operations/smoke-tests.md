# Smoke-Tests

Nach Bereitstellung, Upgrade oder Disaster Recovery ausführen.

## Automatisiertes Skript

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url https://ufw.example.com
```

Flags:

| Flag | Zweck |
|------|-------|
| `--env-file .env` | Produktionsvariablen laden (erfordert `NPM_NETWORK` für Prod-Compose) |
| `--ghcr` | `docker-compose.ghcr.yml`-Overlay einbeziehen |
| `--app-url URL` | Zusätzlich öffentliches HTTPS `/api/health` per curl prüfen |

Das Skript verifiziert:

- Postgres healthy
- `ufw-migrate` exited 0
- `ufw-app` healthy
- Internes `/api/health` liefert `{"status":"ok","db":"ok"}`

## Manueller Health-Check

```bash
docker compose --env-file .env ps
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

## Browser-Checkliste

1. `APP_URL/login` — authentifizieren
2. **SSH-Identitäten** — Identität vorhanden oder anlegen
3. **Server** — SSH-Test erfolgreich
4. **Regeln** — Anwenden-Vorschau läuft (Bestätigung optional)
5. **Vorgangsverlauf** — aktuelle Einträge sichtbar

## Erstinstallation

`APP_URL/setup` statt `/login` verwenden, um einmal das Administratorkonto anzulegen.

## Verwandte Dokumentation

- [Ersteinrichtung](../user-guide/initial-setup.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
