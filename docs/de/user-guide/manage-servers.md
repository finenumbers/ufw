# Server verwalten

Dieser Leitfaden behandelt den Server-Lebenszyklus: hinzufügen, Dashboard, aktualisieren, UFW installieren, bearbeiten, löschen und Listenstatistiken.

## Voraussetzungen

Erstellen Sie mindestens eine [SSH-Identität](../concepts/ssh-identities.md), bevor Sie einen Server hinzufügen.

## Server hinzufügen

1. Seitenleiste → **Server** → **Server hinzufügen**
2. Name, Host, Port ausfüllen, Identität auswählen
3. **Server erstellen** — SSH wird beim Absenden automatisch verifiziert
4. Bei Erfolg Server-Dashboard öffnen

Schlägt die Verifizierung fehl, prüfen Sie Host-Erreichbarkeit, Zugangsdaten, Firewall die SSH vom Docker-Host erlaubt und [Host-Validierung](../concepts/servers-and-ssh.md).

## Server-Dashboard

Das Dashboard lädt **gecacheten UFW-Zustand** aus dem neuesten Postgres-Snapshot — kein SSH beim ersten Paint.

Wenn Portscan aktiviert ist, lädt das Scan-Panel den **neuesten Scan beliebigen Status** aus Postgres (einschließlich laufender Scans seit v0.9.2).

| UFW-Status | Aktionen |
|------------|----------|
| Nicht installiert | **Status aktualisieren**, dann **UFW installieren** (nachdem Refresh fehlendes bestätigt) |
| Installiert aber inaktiv | **Status aktualisieren** — Install-Button ausgeblendet, wenn UFW existiert aber inaktiv |
| Installiert und aktiv | **Regel hinzufügen**, **Regeln speichern**, **Status aktualisieren**, optional **Scan ports** |

**Status aktualisieren** führt Live-SSH aus, aktualisiert Snapshot und synchronisiert Regeltabelle. **UFW installieren** bleibt deaktiviert, bis Refresh bestätigt, dass UFW nicht installiert ist.

Bis zum Refresh kann das UFW-Badge ein **gecachtes** Label vom letzten Snapshot zeigen.

### Warnung bei ungespeicherten Änderungen

Bei ungespeicherten Entwurfsänderungen fragt Refresh vor dem Neuladen vom Server zur Bestätigung.

### Automatischer Initial-Sync

Wenn **kein UFW-Snapshot** in Postgres existiert (neuer Server, nie aktualisiert), läuft einmalig ein Hintergrund-Sync-Vorgang, um den Cache zu füllen. Vorgangsbanner beobachten.

## Regel- und Port-Statistiken

| Ort | Metrik | Bedeutung |
|-----|--------|-----------|
| **Serverliste**-Karte | gespeicherte Regeln | Lokale `ruleRecord`-Anzahl |
| **Serverliste**-Karte | offene Ports | Funde des letzten erfolgreichen Scans (wenn aktiviert) |
| **Dashboard**-Badge | in Tabelle | Sichtbare Regeltabellen-Zeilenanzahl |

Dashboard *in Tabelle* kann sich von *gespeicherte Regeln* unterscheiden während Bearbeitung oder vor Apply.

## Server bearbeiten

1. Serverseite → **Bearbeiten**
2. Name, Host, Port oder Identität ändern
3. SSH wird beim Absenden verifiziert, wenn sich Verbindungsparameter geändert haben

Bearbeitungsseite zeigt Host-Key-Fingerabdruck und **nicht verifiziert**-Warnung wenn zutreffend.

## Server löschen

**Gefahrenbereich** auf der Bearbeitungsseite:

- Entfernt lokale Regeln, Entwürfe, Snapshots, Scans für diesen Server
- Ändert **nicht** Remote-UFW

Nur bestätigen beim Entfernen von Verwaltungsdaten, nicht beim Löschen von Remote-Firewall-Regeln.

## Konfigurationstools der Serverliste

- **Konfiguration speichern** / **Konfiguration laden** — vollständiger JSON-v2-Export/Import — siehe [Konfiguration importieren und exportieren](../concepts/import-export-config.md)

## Verwandte Dokumentation

- [Server und SSH](../concepts/servers-and-ssh.md)
- [Regeln bearbeiten und anwenden](./edit-and-apply-rules.md)
- [Portscan](./port-scan.md)
