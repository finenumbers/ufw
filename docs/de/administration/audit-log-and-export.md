# Audit-Protokoll und Export

Es existieren zwei Protokollierungsebenen: **Vorgangsprotokolle** (technisch) und **Audit-Ereignisse** (Sicherheit/Compliance).

## Audit-Ereignisse

Geschrieben in die Tabelle `audit_event`. Beispiele:

| Aktion | Wann |
|--------|------|
| `LOGIN` | Benutzersitzung erstellt |
| `LOGOUT` | Sitzung gelöscht |
| `CONFIG_EXPORT` | Serverkonfiguration exportiert (nach Passwort-Neueingabe) |

Anzeige unter **Vorgangsverlauf** → Tab **Audit**.

## Vorgangsprotokolle

Geschrieben für lang laufende Arbeit: Anwenden, Aktualisieren, Installieren, SSH-Test usw. Enthält Schritt-Metadaten und Erfolgs-/Fehlermeldungen.

Anzeige unter **Vorgangsverlauf** → Tab **Vorgänge** oder im live **Vorgangsbanner**.

## Audit-Trail für Konfigurationsexport

Jeder erfolgreiche Export erzeugt einen `CONFIG_EXPORT`-Audit-Datensatz mit Benutzer-ID und Zeitstempel. Damit lässt sich nachverfolgen, wer Dateien mit Zugangsdaten im Klartext heruntergeladen hat.

## Aufbewahrung

Snapshot-Aufbewahrung behält die letzten **10** Snapshots pro Server (ältere werden automatisch gelöscht). Vorgangsprotokoll-Aufbewahrung kann manuell in der Oberfläche gelöscht werden.

Planen Sie eine Backup-Richtlinie für Audit-Daten, wenn Compliance lange Aufbewahrung erfordert — siehe [Backup und Wiederherstellung](../operations/backup-restore.md).

## Verwandte Dokumentation

- [Konfiguration importieren und exportieren](../concepts/import-export-config.md)
- [Vorgangsverlauf](../user-guide/operations-history.md)
- [SECURITY.md](../../../SECURITY.md)
