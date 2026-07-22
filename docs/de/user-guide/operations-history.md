# Vorgangsverlauf

Langlaufende Aufgaben — Apply, Sync, Refresh, UFW installieren, Portscan — werden in **Vorgangsprotokollen** erfasst und in der UI angezeigt.

## Vorgangsbanner

Während Arbeit läuft, erscheint oben ein Banner:

| Element | Beschreibung |
|---------|--------------|
| Status | RUNNING, PENDING, SUCCESS, FAILED, PARTIAL |
| Schritte | Aufklappbarer Schrittstatus |
| Nachricht | Übersetzter Fortschritts- oder Fehlertext |

**SUCCESS** schließt sich nach ~10 Sekunden automatisch. **FAILED** und **PARTIAL** bleiben bis zum Schließen.

### Polling-Verhalten (v0.9.2)

- Pollt ~**1 Sekunde**, während Vorgang RUNNING oder PENDING ist
- **Stoppt Polling im Idle-Zustand** — keine Hintergrund-5-Sekunden-Schleife
- Startet neu, wenn ein neuer Vorgang beginnt
- Bei Abschluss dispatcht Event, damit Serverseiten SSR-Daten aktualisieren

Siehe [Vorgänge und Nebenläufigkeit](../concepts/operations-and-concurrency.md).

### Hängendes Banner

Wenn Banner nach Trennung RUNNING zeigt, Seite aktualisieren. Hintergrund-Sweeper markiert sehr alte RUNNING-Vorgänge innerhalb von ~30–60 Minuten als fehlgeschlagen.

## Vorgangsseite

Seitenleiste → **Vorgangsverlauf** (`/operations`)

| Tab | Inhalt |
|-----|--------|
| **Vorgänge** | Technisches Protokoll — Apply, Sync, Refresh, Portscan, Server-Erstellungsfehler |
| **Audit** | Sicherheitsereignisse — Anmeldung, Abmeldung, Konfigurationsexport, UFW-Aktionen |

Beide Tabs unterstützen unendliches Scrollen für ältere Einträge.

## Vorgangstypen

Datenbank speichert dotted names; UI übersetzt sie.

| Typ | Beschreibung |
|-----|--------------|
| `apply.rules` | UFW-Apply-Sitzung |
| `ufw.refresh` | Status aktualisieren — Live-SSH + Regel-Sync |
| `ufw.sync` | Hintergrund-Initial-Sync ohne Snapshot |
| `ufw.install` | Remote-UFW installieren und aktivieren |
| `port.scan` | Externer Portscan |
| `server.create` | Server erstellen mit SSH-Fehler |

Legacy (nur historische Einträge):

- `ssh_test` — vor v0.7.4; wird nicht mehr erstellt

## Verlauf löschen

**Verlauf löschen** entfernt alte Vorgangsprotokoll-Einträge aus UI/Datenbank gemäß Retention-Aktion. Betrifft nicht Server, Regeln oder Remote-UFW.

Audit-Tab kann Ereignisse gemäß Richtlinie behalten — siehe [Audit-Log und Export](../administration/audit-log-and-export.md).

## Verwandte Dokumentation

- [Vorgänge und Nebenläufigkeit](../concepts/operations-and-concurrency.md)
- [Entwurf-und-Anwenden-Workflow](../concepts/draft-apply-workflow.md)
- [Portscan](./port-scan.md)
