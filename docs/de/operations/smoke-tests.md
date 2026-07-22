# Smoke-Tests

Nach Deploy, Upgrade oder Disaster Recovery ausführen.

## Automatisiertes Skript

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url https://ufw.example.com
```

| Flag | Zweck |
|------|-------|
| `--env-file .env` | Produktionsvariablen laden |
| `--ghcr` | `docker-compose.ghcr.yml` einschließen |
| `--app-url URL` | Öffentliches HTTPS `/api/health` prüfen |

Verifiziert: Postgres healthy, Migrate Exit 0, App healthy, Health-JSON enthält Version.

## Manueller Health-Check

```bash
docker compose --env-file .env ps
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

## Browser-Checkliste

1. `APP_URL/login` — authentifizieren
2. **SSH-Identitäten** — Identität erstellen oder verifizieren
3. **Server** — erstellen/aktualisieren; SSH-Verifizierung erfolgreich
4. **Status aktualisieren** — UFW-Snapshot erstellt
5. **Regeln** — Apply-Vorschau läuft; optional Bestätigen auf Testserver
6. **Vorgangsverlauf** — aktuelle Einträge sichtbar
7. **Initial-Sync** — neuer Server ohne Snapshot erhält Hintergrund-Sync
8. **Portscan** (wenn aktiviert) — Scan starten; Seite mitten im Scan aktualisieren — Panel setzt fort (v0.9.2)
9. **Anwenden** — nach Bestätigen stimmt Regelanzahl mit Remote überein

## Erstinstallation

`APP_URL/setup` einmal verwenden, um Administratorkonto zu erstellen.

## Verwandte Dokumentation

- [Ersteinrichtung](../user-guide/initial-setup.md)
- [Server verwalten](../user-guide/manage-servers.md)
