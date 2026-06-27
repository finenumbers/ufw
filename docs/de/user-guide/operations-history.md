# Vorgangsverlauf

Langlaufende Aufgaben (Anwenden, Aktualisieren, UFW installieren, Port-Scan, Docker-Inventar) werden in **Vorgangsprotokollen** erfasst und in der UI angezeigt.

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
| **Vorgänge** | Technisches Vorgangsprotokoll — Anwenden, Sync, Aktualisieren, Port-Scan, Docker usw. |
| **Audit** | Sicherheitsrelevante Ereignisse — Anmeldung, Abmeldung, Konfigurationsexport |

Beide unterstützen unendliches Scrollen für ältere Einträge.

## Vorgangstypen

In der Datenbank werden Typnamen mit Punkt gespeichert (z. B. `ufw.refresh`). Die UI übersetzt sie mit Unterstrich-Schlüsseln (z. B. `ufw_refresh`).

Aktive Beispiele:

- `apply_rules` / `apply.rules` — UFW anwenden
- `ufw_refresh` / `ufw.refresh` — Status aktualisieren (Live-SSH-Lesen + Regel-Sync)
- `ufw_sync` / `ufw.sync` — Hintergrund-Initial-Sync, wenn kein Snapshot existiert
- `ufw_install` / `ufw.install` — UFW installieren (Aktivierung läuft innerhalb der Installation)
- `port_scan` / `port.scan` — externer Port-Scan
- `docker_inventory` / `docker.inventory` — Docker-Inventar aktualisieren
- `docker_control` / `docker.control` — Container starten/stoppen/neu starten
- `server_create` / `server.create` — neuer Server hinzugefügt

Legacy (nur historische Protokolleinträge):

- `ssh_test` — aus Releases vor v0.7.4; wird nicht mehr erzeugt

## Verlauf löschen

Administratoren können alten Vorgangsverlauf in der UI löschen (Audit-Ereignisse können gemäß Aufbewahrungsrichtlinie erhalten bleiben). Das Löschen beeinflusst weder Serverstatus noch Regeln.

## Verwandte Dokumentation

- [Audit-Protokoll und Export](../administration/audit-log-and-export.md)
- [Entwurf- und Anwenden-Workflow](../concepts/draft-apply-workflow.md)
