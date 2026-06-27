# Docker-Container-Überwachung

UFW Remote Manager kann **Docker-Container** auf jedem registrierten Server per **SSH** inventarisieren und steuern (gleicher Transport wie UFW-Operationen).

Ergebnisse erscheinen in einer Tabelle **unter dem Port-Scan-Panel** auf der Serverseite.

## Aktivieren

In der App-Umgebung setzen (Compose / Portainer):

```env
DOCKER_MONITOR_ENABLED=true
```

Optionale Feineinstellung:

| Variable | Standard | Zweck |
|----------|----------|-------|
| `DOCKER_INVENTORY_HISTORY_LIMIT` | `10` | Gespeicherte Inventar-Snapshots pro Server |
| `DOCKER_COMMAND_TIMEOUT_MS` | `60000` | SSH-Befehls-Timeout für Docker CLI |

Inventar-Aktualisierung und Container-Steuerung (start/stop/restart) teilen sich eine **30-Sekunden**-Abklingzeit pro Server (fest im App-Code seit v0.5.1). Legacy `DOCKER_REFRESH_RATE_LIMIT_WINDOW_MS` und `DOCKER_CONTROL_RATE_LIMIT_WINDOW_MS` in `.env` werden **ignoriert**.

## Anforderungen auf verwalteten Servern

- **Docker CLI** installiert (`docker` in PATH)
- Docker-Daemon für den SSH-Benutzer erreichbar
- Entweder Mitgliedschaft in der Gruppe **`docker`** oder **passwortloses sudo** für `docker`

Die App versucht zuerst `docker …`, dann `sudo docker …` bei Berechtigungsverweigerung.

## Funktionen (MVP)

- Inventar aktualisieren: `docker ps -a`, Stats für laufende Container
- Tabelle: Name, Image, Status, Health, Ports, CPU/Speicher, Compose-Labels
- Gruppierung nach Compose-Projekt
- Container-Detail-Drawer (`docker inspect`, maskierte Env-Vars)
- Steuerung: **start**, **stop**, **restart** (Bestätigung für stop/restart)
- Vorgangsfortschritts-Banner + Audit-Ereignisse

## Sicherheit

- Feature-Flag (standardmäßig aus)
- Container-ID/Name-Validierung — kein beliebiges Shell aus der UI
- Nur feste Steuerungsaktionen
- Feste 30s-Rate-Limits für Aktualisierung und Steuerung (nicht per Env konfigurierbar)
- Audit: `DOCKER_INVENTORY_REFRESHED`, `DOCKER_CONTAINER_*`

## Fortschritts-Polling

Während die Inventar-Aktualisierung läuft, pollt die UI einen leichtgewichtigen Status-Endpunkt. Polling startet **sofort**, dann alle **1s** solange die Operation aktiv ist (Backoff nach ~30 Min.). Bei Abschluss im Banner aktualisieren sich die Panels sofort. Das Banner pollt alle **1s** im Status RUNNING.

## Verwandte Dokumentation

- [Bereitstellungsübersicht](./overview.md)
- [Sicherheitsmodell](../administration/security-model.md)
