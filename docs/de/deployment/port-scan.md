# Externer Portscan (Bereitstellung)

Administratoren aktivieren externen Portscan über Umgebungsvariablen. Benutzerseitige Nutzung: [Portscan (Benutzerhandbuch)](../user-guide/port-scan.md).

## Was er leistet

Vom **ufw-app**-Container scannt die App die `host`-Adresse jedes registrierten Servers:

1. **Naabu** — TCP-Discovery Ports 1–65535
2. **Nmap** — Service-Erkennung auf entdeckten Ports

Ergebnisse in Postgres gespeichert und auf der Serverseite angezeigt. Für Scans wird **kein SSH** verwendet.

## Aktivieren

```env
PORT_SCAN_ENABLED=true
```

App-Container nach Änderung neu starten. Image muss Naabu und Nmap enthalten (offizielles Dockerfile tut dies).

## Optionale Feinabstimmung

| Variable | Standard | Zweck |
|----------|----------|-------|
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | An Nmap gesendete Ports begrenzen |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `1800000` | Discovery-Timeout (30 Min.) |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Anreicherungs-Timeout (10 Min.) |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | Pro Server aufbewahrte Scans |

## Netzwerkanforderungen

App-Container muss **verwaltete Server-Hosts auf gescannten TCP-Ports** erreichen, nicht nur SSH `:22`. Egress vom Docker-Host (oder App-Netzwerk) zu Zielservern erlauben.

Nur **registrierte Server-Hosts** werden gescannt — beliebige Ziele abgelehnt.

## Nebenläufigkeit (v0.9.2)

| Thema | Verhalten |
|-------|-----------|
| SSH-Warteschlange | Portscan **nutzt nicht** Pro-Server-SSH-Warteschlange — UFW-Refresh/Apply nicht 30+ Min. blockiert |
| Overlap | Nur ein PENDING/RUNNING-Scan pro Server; zweiter Start abgelehnt |
| Ratenlimit | 30 Sekunden zwischen Scan-Starts pro Server (fest im Code) |
| SSR | Serverseite lädt neuesten Scan **beliebigen Status** — laufende Scans setzen nach Refresh fort |

Funde persistieren via atomarem Replace (`deleteMany` + `createMany` in einer Transaktion).

## UFW-Abdeckung

Siehe [Portscan-Benutzerhandbuch](../user-guide/port-scan.md#ufw-abdeckungswerte) für Spaltensemantik.

## Sicherheit

- Audit: `PORT_SCAN_STARTED`, `PORT_SCAN_COMPLETED`
- Connect-Scans only (`-sT`) — keine Raw-Socket-Capabilities erforderlich
- Standardmäßig deaktiviert

## Verwandte Dokumentation

- [Umgebungsvariablen](../administration/environment-variables.md)
- [Architektur](../architecture.md)
- [Vorgänge und Nebenläufigkeit](../concepts/operations-and-concurrency.md)
