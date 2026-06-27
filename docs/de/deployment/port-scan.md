# Externer Port-Scan

UFW Remote Manager kann einen **externen Port-Scan** vom `ufw-app`-Container zur `host`-Adresse jedes registrierten Servers ausführen. Die Pipeline nutzt:

1. **Naabu** — TCP-Erkennung auf Ports 1–65535 (`host/port/protocol/open`)
2. **Nmap** — Service-Erkennung nur auf entdeckten Ports (`-sV`, XML-Ausgabe)

Ergebnisse erscheinen in einer Tabelle **unter den UFW-Regeln** auf der Serverseite.

## Aktivieren

In der App-Umgebung setzen (Compose / Portainer):

```env
PORT_SCAN_ENABLED=true
```

Optionale Feineinstellung:

| Variable | Standard | Zweck |
|----------|----------|-------|
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | Max. Ports für Nmap-Anreicherung |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `1800000` | Timeout für Vollport-Erkennung (30 Min.) |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Timeout für Anreicherung |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | Gespeicherte Scan-Läufe pro Server |

Wiederholte Scans desselben Servers sind auf **einmal alle 30 Sekunden** begrenzt (fest im App-Code seit v0.5.1). Legacy `PORT_SCAN_RATE_LIMIT_WINDOW_MS` in `.env` wird **ignoriert**.

## Netzwerkanforderungen

Der App-Container muss **verwaltete Server-Hosts auf gescannten TCP-Ports** erreichen, nicht nur SSH `:22`. Stellen Sie sicher, dass Routing-/Firewall-Regeln Egress vom Docker-Host (oder `ufw-app`-Netzwerk) zu Zielservern erlauben.

Diese Funktion scannt **nur bereits in UFW Remote Manager registrierte Hosts** — beliebige Ziele werden abgelehnt.

## UFW-Abdeckungsspalte

Jeder offene Port wird mit dem neuesten UFW-Snapshot unter **External-Scan-Semantik** verglichen:

| Wert | Bedeutung |
|------|-----------|
| **Allowed** | Eingehendes ALLOW/LIMIT von **beliebiger** Quelle (`From = any`) deckt diesen Port ab |
| **Not in UFW** | Port ist extern offen, aber nicht durch öffentliches eingehendes ALLOW abgedeckt — prüfen |
| **Denied** | Eingehendes DENY/REJECT von **beliebiger** Quelle betrifft diesen Port |
| **Unknown** | UFW inaktiv oder kein Snapshot |

Whitelist-Regeln (`From = specific IP/CIDR`, `To Port = any`) gelten **nicht** als erlaubt für External Scan. Nur Regeln, die explizit Traffic von überall erlauben, gelten als öffentliche Exposition.

## Sicherheitshinweise

- Rate-Limited (30 Sekunden zwischen Wiederholungsscans pro Server; nicht per Env konfigurierbar)
- Audit-Ereignisse: `PORT_SCAN_STARTED`, `PORT_SCAN_COMPLETED`
- Scans laufen in der pro-Server-Warteschlange neben SSH-Operationen (serialisiert)
- Nutzt Connect-Scans (`naabu -scan-type c`, `nmap -sT`) — keine Raw-Socket-Capabilities erforderlich

## Fortschritts-Polling

Während ein Scan läuft, pollt die UI einen leichtgewichtigen Status-Endpunkt (keine vollständigen SSH-Neulesungen). Polling-Intervall steigt: **3s → 5s → 10s** im Verlauf. Das Vorgangsbanner zeigt Schrittfortschritt.

## Verwandte Dokumentation

- [Bereitstellungsübersicht](./overview.md)
- [Sicherheitsmodell](../administration/security-model.md)
