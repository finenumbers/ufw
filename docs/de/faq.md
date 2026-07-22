# FAQ

## Allgemein

### Was ist UFW Remote Manager?

Eine selbst gehostete Web-App zur Verwaltung von UFW-Firewalls auf entfernten Linux-Servern über SSH, mit Entwurf/Anwenden-Workflow und Audit-Trail.

### Ersetzt sie Nginx Proxy Manager?

Nein. NPM (oder ähnlich) terminiert HTTPS für die Admin-UI. UFW Remote Manager verwaltet **Remote-Server-Firewalls**, nicht Ihren Reverse-Proxy.

### Kann ich Docker-Container verwalten?

Nein. Docker-Container-Monitoring wurde **in v0.9.0 entfernt**. Die App verwaltet nur UFW-Regeln und optionale externe Portscans.

### Wie viele Admin-Benutzer?

Ein Konto nach der initialen `/setup`. Keine Multi-User-UI.

### Kann ich mehrere App-Repliken betreiben?

Nicht empfohlen. Ratenlimits und Warteschlangen sind In-Memory (Single-Replica-Design).

## SSH und Server

### Warum wird eine private IP abgelehnt?

Standard-Sicherheit — blockiert RFC1918- und Metadaten-Adressen. Setzen Sie `SSH_ALLOWED_CIDRS` für Lab/VPN-Ziele.

### Warum ist Anwenden deaktiviert?

SSH-Host-Key ist möglicherweise **nicht verifiziert**. Führen Sie zuerst **Status aktualisieren** erfolgreich aus.

### Ändert Server löschen Remote-UFW?

Nein. Löschen entfernt nur lokale Verwaltungsdaten.

## Regeln und Anwenden

### Vorschau vs. Bestätigen?

Die Vorschau zeigt geplante Änderungen ohne Ausführung. Bestätigen führt UFW-Befehle über SSH aus.

### Remote hat sich seit der Vorschau geändert?

Apply abgelehnt — **Regeln speichern** (Vorschau) erneut ausführen. In diesem Fall nicht erzwungene Synchronisation verwenden.

### Teilweises Anwenden?

Siehe [Entwurf-und-Anwenden-Workflow](./concepts/draft-apply-workflow.md). **Erzwungene Synchronisation vom Server** verwenden, wenn angezeigt.

### Warum unterscheiden sich Regelzahlen?

**Gespeicherte Regeln** (Listenkarte) vs. **in Tabelle** (Dashboard) zählen Unterschiedliches — siehe [UFW-Regeln und Zustände](./concepts/ufw-rules-and-states.md).

## Vorgangs-UI

### Banner bleibt auf LÄUFT?

Seite aktualisieren. Sweeper bereinigt veraltete Vorgänge innerhalb von ~30–60 Minuten.

### Regeln aktualisieren sich nach Sync nicht?

Seit v0.9.2 sollte das Ende eines Vorgangs eine Seitenaktualisierung auslösen. Einmal manuell im Browser aktualisieren.

## Portscan

### Scan-Button fehlt?

`PORT_SCAN_ENABLED` ist in der App-Umgebung nicht auf `true` gesetzt.

### Scan läuft bereits?

Nur ein aktiver Scan pro Server. Warten oder Vorgangsverlauf prüfen.

### Blockiert der Scan UFW-Refresh?

Nein (seit v0.9.2). Scan läuft außerhalb der SSH-Warteschlange.

## Bereitstellung

### Wo Migrationen ausführen?

Im **migrate**- / **ufw-migrate**-Container — nicht in **ufw-app**. Siehe [Bereitstellungsübersicht](./deployment/overview.md).

### EACCES beim Ausführen von Prisma im App-Container?

Erwartet — `docker compose run --rm migrate` verwenden.

## Verwandte Dokumentation

- [Fehlerbehebung](./troubleshooting.md)
- [Einführung](./introduction.md)
