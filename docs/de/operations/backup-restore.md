# Backup und Wiederherstellung

Schützen Sie **PostgreSQL-Daten** und **`.env`-Secrets**. Remote-UFW-Regeln auf verwalteten Servern sind nicht in Backups enthalten, sofern nicht in Snapshots innerhalb der Datenbank erfasst.

## Was sichern

| Element | Enthält |
|---------|---------|
| **Postgres-Volume** | Benutzer, Identitäten (verschlüsselt), Server, Regeln, Snapshots, Scans, Audit |
| **`.env`-Datei** | `APP_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`, `POSTGRES_PASSWORD`, `APP_URL` |

Ohne `.env` können verschlüsselte Identitäts-Secrets nach Restore nicht entschlüsselt werden.

Optional: periodischer [JSON-v2-Konfigurationsexport](../concepts/import-export-config.md) als menschenlesbare Disaster-Kopie (enthält entschlüsselte Secrets — at rest verschlüsseln).

## Postgres sichern

Volume finden:

```bash
docker volume ls | grep ufw
docker inspect ufw-postgres --format '{{range .Mounts}}{{.Name}}{{end}}'
```

Logischer Dump (empfohlen):

```bash
docker exec ufw-postgres pg_dump -U ufw ufw | gzip > ufw-$(date +%F).sql.gz
```

Dump und `.env` an getrennten sicheren Orten aufbewahren.

## Wiederherstellen

1. App stoppen: `docker compose ... stop app`
2. Datenbank wiederherstellen (in leeres oder frisches Postgres-Volume)
3. `.env` mit **demselben** `APP_ENCRYPTION_KEY` wie bei Verschlüsselung der Daten wiederherstellen
4. `docker compose ... up -d`
5. [Smoke-Tests](./smoke-tests.md) ausführen

## Verwandte Dokumentation

- [Konfiguration importieren und exportieren](../concepts/import-export-config.md)
- [Upgrade und Rollback](./upgrade-rollback.md)
