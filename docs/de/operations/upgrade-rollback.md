# Upgrade und Rollback

## Upgrade (empfohlen)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

Der **migrate**-Service führt `prisma migrate deploy` automatisch aus.

Verifizieren:

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

## Versionshinweise

| Version | Migration | Wichtige Änderungen |
|---------|-----------|---------------------|
| **v0.9.0** | Ja — entfernt Legacy-Inventar-Tabellen | Legacy-Inventar-UI entfernt |
| **v0.9.1** | Nein | Legacy-Bereinigung, Doc-Guardrails |
| **v0.9.2** | Nein | Apply-Sync-Fix, Vorgangsbanner-Lebenszyklus, Portscan außerhalb SSH-Warteschlange, Overlap-Schutz |

Beim Upgrade von vor v0.9.0 sicherstellen, dass Migrate abgeschlossen ist — Legacy-Inventar-Daten bereinigt.

Image pinnen: `GHCR_IMAGE_TAG=v0.9.5` in `.env`.

## Rollback

1. `GHCR_IMAGE_TAG` auf vorherigen bekannt guten Tag setzen
2. `docker compose ... pull && up -d`
3. Wenn Migration bereits forward-only angewendet, kann Wiederherstellung älterer DB-Backups nötig sein — Rollback in Staging testen

Datenbankmigrationen werden im Allgemeinen **nicht** automatisch rückgängig gemacht.

## Zero-Downtime

Single-Container-App — kurzer Neustart während `up -d` erwarten. Wartungsfenster in Produktion planen.

## Verwandte Dokumentation

- [GHCR + Compose](../deployment/ghcr-compose.md)
- [Backup und Wiederherstellung](./backup-restore.md)
