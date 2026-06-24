# Einführung

**UFW Remote Manager** ist eine selbst gehostete Webanwendung zur Verwaltung von **UFW (Uncomplicated Firewall)** auf Remote-Linux-Servern über **SSH**. Sie bearbeiten Firewall-Regeln im Browser, sehen Änderungen in der Vorschau, bestätigen sie explizit und wenden sie sicher an — mit vollständigem Audit-Trail.

Repository: [github.com/finenumbers/ufw](https://github.com/finenumbers/ufw)

## Für wen ist es gedacht?

- **Systemadministratoren**, die mehrere Linux-Server verwalten und eine strukturierte Oberfläche manuellen `ufw`-CLI-Sitzungen vorziehen
- **Kleine Teams**, die eine zentrale Stelle für Firewall-Entwürfe, Anwenden-Vorschauen und Vorgangsverlauf benötigen
- **Self-Hoster**, die ihre eigene Infrastruktur hinter einem Reverse Proxy betreiben (Nginx Proxy Manager empfohlen)

## Was es kann

- Verbindung zu Linux-Servern über SSH (Passwort oder privater Schlüssel)
- UFW remote erkennen, installieren und aktivieren
- Live-UFW-Regeln laden, in einer Tabelle bearbeiten (mit Gruppen, Namen, Suche, Neuordnung)
- **Entwurf → Vorschau → Bestätigen → Anwenden**-Workflow mit Diff-Visualisierung
- Regeln aus CSV, XLSX oder JSON importieren; vollständige Serverkonfiguration exportieren/importieren
- SSH-Zugangsdaten ruhend verschlüsseln; SSH-Host-Keys pinnen; sensible Aktionen auditieren
- Mehrsprachige Oberfläche (Englisch, Deutsch, Französisch, Spanisch, Italienisch, Portugiesisch, Russisch)

## Was es nicht kann

| Erwartung | Realität |
|-----------|----------|
| Ersetzt Ihren Reverse Proxy | **Nein.** Nginx Proxy Manager (oder ähnlich) terminiert HTTPS separat |
| Verwaltet rohe `iptables` ohne UFW | **Nein.** Zielt auf Server, bei denen UFW die Firewall-Oberfläche ist |
| Multi-Tenant-SaaS | **Nein.** Einzelinstanz, selbst gehostet; ein Administratorkonto nach der Einrichtung |
| Hochverfügbarkeits-Cluster | **Nein.** Ausgelegt für **eine App-Replik** (In-Memory-Rate-Limits) |
| Automatische Firewall-Änderungen ohne Bestätigung | **Nein.** Anwenden erfordert immer explizite Benutzerbestätigung |

## Anforderungen

### Verwaltungshost (wo Docker läuft)

- Docker und Docker Compose
- Optional: Portainer, bestehende Nginx-Proxy-Manager-Installation
- Netzwerkzugriff vom App-Container zu Zielservern über SSH (Port 22 oder benutzerdefiniert)

### Zielserver (verwaltete Linux-Hosts)

- Linux mit verfügbarem UFW (`apt install ufw` oder gleichwertig)
- SSH-Zugang mit ausreichenden Rechten zum Ausführen von `ufw`-Befehlen
- Ausgehende Verbindung vom Verwaltungshost zum SSH-Port des Servers

### Produktion

- Öffentliche **HTTPS**-URL für die Admin-Oberfläche (`APP_URL`)
- Starke Geheimnisse in `.env` (niemals in Git committen)

## Nächste Schritte

- [Schnellstart](./quick-start.md) — lokal in Docker ausführen
- [Architektur](./architecture.md) — wie die Komponenten zusammenwirken
- [Bereitstellungsübersicht](./deployment/overview.md) — Produktion hinter NPM
