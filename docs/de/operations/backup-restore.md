# Backup und Wiederherstellung

Der gesamte Anwendungszustand liegt in **PostgreSQL** (`ufw-postgres`, Volume `ufw_postgres_data`). Laufzeitgeheimnisse liegen in **`.env`** auf dem Host.

## Was zu sichern ist

| Element | Für vollständige Wiederherstellung erforderlich |
|---------|---------------------------------------------------|
| Postgres-Dump | Ja |
| `.env`-Datei | Ja — `APP_ENCRYPTION_KEY` entschlüsselt SSH-Zugangsdaten |
| Konfigurationsexport JSON | Optionale Klartext-Notfallkopie |

Backups niemals in Git committen.

## Volume finden

```bash
docker volume ls | grep ufw
docker inspect ufw-postgres --format '{{range .Mounts}}{{.Name}}{{end}}'
```

## Backup

### Automatisiertes Skript

```bash
BACKUP_DIR=/var/backups/ufw ENV_FILE=.env ./scripts/backup-postgres.sh
```

### Manueller SQL-Dump

```bash
docker exec ufw-postgres pg_dump -U ufw ufw | gzip > ufw-$(date +%F).sql.gz
install -m 600 .env env-$(date +%F).env
```

## Wiederherstellung

1. App stoppen: `docker compose ... stop app`
2. Datenbank aus Dump wiederherstellen (detaillierte Schritte im Legacy-Runbook — DB drop/recreate bei sauberer Wiederherstellung)
3. Passende `.env` wiederherstellen (gleicher `APP_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`)
4. `docker compose ... up -d`
5. `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

Ohne den ursprünglichen `APP_ENCRYPTION_KEY` SSH-Identitätsgeheimnisse manuell neu eingeben oder aus Klartext-Konfigurationsexport wiederherstellen.

## Disaster-Recovery-Checkliste

1. `.env` aus sicherem Backup wiederherstellen
2. Postgres-Dump wiederherstellen
3. Prüfen, dass `ufw-migrate` mit exit 0 beendet
4. Anmeldung unter `APP_URL/login`
5. **Status aktualisieren** auf jedem Server-Dashboard

## Verwandte Dokumentation

- [Upgrade und Rollback](./upgrade-rollback.md)
- [Konfiguration importieren und exportieren](../concepts/import-export-config.md)
