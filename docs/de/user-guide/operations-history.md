# Vorgangsverlauf

Lang laufende Aufgaben (Anwenden, Aktualisieren, UFW installieren, SSH-Test) werden in **Vorgangsprotokollen** erfasst und in der Oberfläche angezeigt.

## Vorgangsbanner

Während ein Vorgang läuft, erscheint oben in der App ein Banner:

- Vorgangstyp und Status (RUNNING, SUCCESS, FAILED)
- Aufklappbare Schrittliste mit Status pro Schritt
- Automatisches Schließen bei Erfolg nach kurzer Verzögerung

Das Banner pollt während der Arbeit auf Updates.

## Vorgangsseite

Seitenleiste → **Vorgangsverlauf** (`/operations`)

Zwei Tabs:

| Tab | Inhalt |
|-----|--------|
| **Vorgänge** | Technisches Vorgangsprotokoll — Anwenden, Sync, SSH-Test usw. |
| **Audit** | Sicherheitsrelevante Ereignisse — Anmeldung, Abmeldung, Konfigurationsexport |

Beide unterstützen unendliches Scrollen für ältere Einträge.

## Vorgangstypen

Beispiele:

- `apply_rules` — UFW anwenden
- `ufw_refresh` — Status und Regeln aktualisieren
- `ufw_sync` — Entwurf mit Server synchronisieren
- `ufw_install` / `ufw_enable` — UFW-Einrichtung
- `ssh_test` — Verbindungsverifizierung
- `server_create` — neuer Server hinzugefügt

## Verlauf löschen

Administratoren können alten Vorgangsverlauf in der Oberfläche löschen (Audit-Ereignisse können je nach Aufbewahrungsrichtlinie erhalten bleiben). Löschen beeinflusst weder Serverzustand noch Regeln.

## Verwandte Dokumentation

- [Audit-Protokoll und Export](../administration/audit-log-and-export.md)
- [Entwurf-und-Anwenden-Workflow](../concepts/draft-apply-workflow.md)
