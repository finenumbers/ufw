# Vorgangsverlauf

Langlaufende Aufgaben (Anwenden, Aktualisieren, UFW installieren, SSH-Test) werden in **Vorgangsprotokollen** erfasst und in der UI angezeigt.

## Vorgangsbanner

Während ein Vorgang läuft, erscheint oben in der App ein Banner:

- Vorgangstyp und Status (RUNNING, SUCCESS, FAILED)
- Ausklappbare Schrittliste mit Status pro Schritt
- Automatisches Ausblenden bei Erfolg nach kurzer Verzögerung

Das Banner pollt während der Ausführung auf Updates.

Bleibt ein Banner nach einer Browser-Trennung auf **RUNNING** oder **PENDING** hängen, laden Sie die Seite neu. Veraltete Vorgänge werden automatisch durch einen Hintergrund-Sweep bereinigt (typischerweise innerhalb von 30–60 Minuten).

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
- `ssh_test` — Verbindungsprüfung
- `server_create` — neuer Server hinzugefügt

## Verlauf löschen

Administratoren können alten Vorgangsverlauf in der UI löschen (Audit-Ereignisse können gemäß Aufbewahrungsrichtlinie erhalten bleiben). Das Löschen beeinflusst weder Serverstatus noch Regeln.

## Verwandte Dokumentation

- [Audit-Protokoll und Export](../administration/audit-log-and-export.md)
- [Entwurf- und Anwenden-Workflow](../concepts/draft-apply-workflow.md)
