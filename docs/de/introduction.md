# Einführung

**UFW Remote Manager** ist eine selbst gehostete Webanwendung zur Verwaltung von **UFW (Uncomplicated Firewall)** auf entfernten Linux-Servern über **SSH**. Sie bearbeiten Firewall-Regeln im Browser, sehen Änderungen in der Vorschau, bestätigen explizit und wenden sie sicher an — mit vollständigem Audit-Trail.

Repository: [github.com/finenumbers/ufw](https://github.com/finenumbers/ufw) · Aktuelles Release: **v0.9.2**

## Für wen ist die App gedacht?

- **Systemadministratoren**, die mehrere Linux-Server verwalten und eine strukturierte Oberfläche statt wiederholter `ufw`-CLI-Sitzungen bevorzugen
- **Kleine Teams**, die eine zentrale Stelle für Firewall-Entwürfe, Apply-Vorschauen und Vorgangsverlauf benötigen
- **Self-Hoster**, die Infrastruktur hinter einem Reverse-Proxy betreiben (Nginx Proxy Manager empfohlen)

## Was die App leistet

| Fähigkeit | Beschreibung |
|-----------|--------------|
| **SSH-Verwaltung** | Verbindung mit Passwort oder privatem Schlüssel; Host-Key-Pinning beim ersten Connect |
| **UFW-Lebenszyklus** | UFW remote erkennen, installieren und aktivieren |
| **Regeltabelle** | Regeln mit Gruppen, Namen, Suche, Filtern, Drag-and-Drop-Neuordnung bearbeiten |
| **Entwurf → Anwenden** | Diff in der Vorschau, Bestätigen, dann UFW-Befehle über SSH ausführen |
| **Schnelle Dashboards** | Serverseiten laden aus gecachten Postgres-Snapshots; Live-SSH nur bei Aktualisierung |
| **Import / Export** | Regeln aus CSV, XLSX, JSON; vollständige Server- und Identitätskonfiguration als JSON v2 |
| **Portscan (optional)** | Externer TCP-Scan mit UFW-Abdeckungszuordnung |
| **Sicherheit** | Verschlüsselte Zugangsdaten at rest; Audit-Log; Step-up-Passwort für Konfigurationsexport |
| **Sprachen** | UI auf Englisch, Deutsch, Französisch, Spanisch, Italienisch, Portugiesisch (Brasilien), Russisch |

## Was die App nicht leistet

| Erwartung | Realität |
|-----------|----------|
| Ersetzt Ihren Reverse-Proxy | **Nein.** Nginx Proxy Manager (oder ähnlich) terminiert HTTPS separat |
| Verwaltet rohes `iptables` ohne UFW | **Nein.** Zielt auf Server, bei denen UFW die Firewall-Front-End ist |
| Docker-Container-Inventar / -Steuerung | **Nein.** In v0.9.0 entfernt — nicht Teil des aktuellen Umfangs |
| Multi-Tenant-SaaS | **Nein.** Single-Instance self-hosted; ein Administratorkonto nach der Einrichtung |
| High-Availability-Cluster | **Nein.** Entworfen für **eine App-Replik** (In-Memory-Ratenlimits) |
| Stille automatische Firewall-Änderungen | **Nein.** Anwenden erfordert immer explizite Benutzerbestätigung |

## Inventar und Statistiken

Seit v0.9.0 bedeutet **Inventar** in der Serverliste:

- **Gespeicherte Regeln** — Anzahl der in lokalen Metadaten gespeicherten Regeln (`ruleRecord`)
- **Offene Ports** — Anzahl aus dem letzten erfolgreichen externen Portscan (wenn aktiviert)

Es gibt kein Docker-Container-Panel und kein Remote-Container-Monitoring.

## Anforderungen

### Management-Host (wo Docker läuft)

- Docker und Docker Compose
- Optional: Portainer, vorhandener Nginx Proxy Manager
- Netzwerk vom App-Container zu Zielservern über SSH (Port 22 oder benutzerdefiniert)
- Für Portscan: Egress vom App-Host zu Ziel-TCP-Ports (nicht nur `:22`)

### Zielserver (verwaltete Linux-Hosts)

- Linux mit verfügbarem UFW (`apt install ufw` oder gleichwertig)
- SSH-Zugang mit Berechtigung zum Ausführen von `ufw`-Befehlen
- Erreichbarer SSH-Port vom Management-Host

### Produktion

- Öffentliche **HTTPS**-URL für die Admin-UI (`APP_URL`)
- Starke Secrets in `.env` (niemals in Git committen)

## Nächste Schritte

- [Schnellstart](./quick-start.md) — lokal in Docker ausführen
- [Architektur](./architecture.md) — Komponenten, Datenfluss, Nebenläufigkeit
- [Bereitstellungsübersicht](./deployment/overview.md) — Produktion hinter NPM
