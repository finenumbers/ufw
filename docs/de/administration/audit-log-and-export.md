# Audit-Log und Export

Zwei ergänzende Spuren: **Vorgangsprotokolle** (Aufgabenfortschritt) und **Audit-Ereignisse** (Sicherheit und Compliance).

## Audit-Ereignisse

In Postgres bei sensiblen Aktionen geschrieben. Beispiele:

| Aktion | Wann |
|--------|------|
| `LOGIN` / `LOGOUT` | Session-Start/Ende |
| `APPLY_PREVIEWED` / `APPLY_CONFIRMED` / `APPLY_COMPLETED` / `APPLY_FAILED` | Apply-Workflow |
| `SNAPSHOT_LOADED` | UFW-Snapshot erfasst |
| `UFW_ENABLE` | Remote-Aktivierung nach Installation |
| `PORT_SCAN_STARTED` / `PORT_SCAN_COMPLETED` | Portscan-Lebenszyklus |
| `CONFIG_EXPORT` / `CONFIG_IMPORT` | JSON-v2-Konfigurationstransfer |
| Server CRUD | Serverdatensätze erstellen/aktualisieren/löschen |

Anzeige unter **Vorgangsverlauf** → **Audit**-Tab mit unendlichem Scrollen.

Audit-Retention folgt Datenbankspeicher — keine automatische Bereinigung, es sei denn der Betreiber löscht den Verlauf.

## Vorgangsprotokolle

Technische Datensätze mit Schritten, Status, Zeitstempeln und Fehlermeldungen. Siehe [Vorgangsverlauf](../user-guide/operations-history.md).

## Konfigurationsexport-Audit

Jeder erfolgreiche **Konfiguration speichern** erstellt einen Audit-Eintrag. Exportdatei enthält **entschlüsselte SSH-Secrets** — wie Password-Vault-Dump schützen.

Export-Ablauf:

1. Passwortbestätigung (Step-up)
2. Kurzlebiges Download-Token
3. JSON-Download über API-Route

Ratenlimit: 5 Exporte pro Minute pro Benutzer.

## Verlauf löschen

**Verlauf löschen** auf der Vorgangsseite entfernt Vorgangsprotokoll-Einträge gemäß UI-Aktion. Rollt Serveränderungen nicht zurück und löscht Audit-Ereignisse nicht in allen Fällen — Bestätigungsdialogtext für aktuelles Verhalten prüfen.

Ändert weder Remote-UFW noch lokale Regelentwürfe.

## Verwandte Dokumentation

- [Konfiguration importieren und exportieren](../concepts/import-export-config.md)
- [Sicherheitsmodell](./security-model.md)
