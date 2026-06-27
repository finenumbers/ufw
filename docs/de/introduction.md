# Einführung

**UFW Remote Manager** ist eine selbst gehostete Webanwendung zur Verwaltung von **UFW (Uncomplicated Firewall)** auf entfernten Linux-Servern über **SSH**. Sie bearbeiten Firewall-Regeln im Browser, sehen Änderungen in der Vorschau, bestätigen sie explizit und wenden sie sicher an — mit vollständigem Audit-Trail.

Repository: [github.com/finenumbers/ufw](https://github.com/finenumbers/ufw)

## Für wen ist es gedacht?

- **Systemadministratoren**, die mehrere Linux-Server verwalten und eine strukturierte UI manuellen `ufw`-CLI-Sitzungen vorziehen
- **Kleine Teams**, die einen zentralen Ort für Firewall-Entwürfe, Anwenden-Vorschauen und Vorgangsverlauf benötigen
- **Self-Hoster**, die ihre eigene Infrastruktur hinter einem Reverse Proxy betreiben (Nginx Proxy Manager empfohlen)

## Was die Anwendung leistet

- Verbindung zu Linux-Servern über SSH (Passwort oder privater Schlüssel)
- UFW remote erkennen, installieren und aktivieren
- Live-UFW-Regeln laden, in einer Tabelle bearbeiten (mit Gruppen, Namen, Suche, Neuordnung)
- Workflow **Entwurf → Vorschau → Bestätigung → Anwenden** mit Diff-Visualisierung
- Schnelles Laden des Server-Dashboards aus gecachten UFW-Snapshots (Live-SSH nur bei Aktualisierung)
- Regeln aus CSV, XLSX oder JSON importieren; vollständige Serverkonfiguration exportieren/importieren
- SSH-Zugangsdaten verschlüsselt speichern; SSH-Host-Keys pinnen; sensible Aktionen auditieren
- Mehrsprachige UI (Englisch, Deutsch, Französisch, Spanisch, Italienisch, Portugiesisch, Russisch)

## Was die Anwendung nicht leistet

| Erwartung | Realität |
|-----------|----------|
| Ersetzt Ihren Reverse Proxy | **Nein.** Nginx Proxy Manager (oder ähnlich) beendet HTTPS separat |
| Verwaltet rohe `iptables` ohne UFW | **Nein.** Zielt auf Server, bei denen UFW die Firewall-Oberfläche ist |
| Multi-Tenant-SaaS | **Nein.** Self-hosted Einzelinstanz; ein Admin-Konto nach der Einrichtung |
| Hochverfügbarkeits-Cluster | **Nein.** Für **eine App-Replik** konzipiert (In-Memory-Rate-Limits) |
| Automatische Firewall-Änderungen ohne Bestätigung | **Nein.** Anwenden erfordert immer explizite Benutzerbestätigung |

## Anforderungen

### Verwaltungshost (wo Docker läuft)

- Docker und Docker Compose
- Optional: Portainer, bestehende Nginx Proxy Manager-Installation
- Netzwerkzugriff vom App-Container zu Zielservern über SSH (Port 22 oder benutzerdefiniert)

### Zielserver (verwaltete Linux-Hosts)

- Linux mit verfügbarem UFW (`apt install ufw` oder gleichwertig)
- SSH-Zugriff mit ausreichenden Rechten für `ufw`-Befehle
- Ausgehende Verbindung vom Verwaltungshost zum SSH-Port des Servers

### Produktion

- Öffentliche **HTTPS**-URL für die Admin-UI (`APP_URL`)
- Starke Geheimnisse in `.env` (niemals in Git committen)

## Nächste Schritte

- [Schnellstart](./quick-start.md) — lokal in Docker ausführen
- [Architektur](./architecture.md) — wie die Komponenten zusammenspielen
- [Bereitstellungsübersicht](./deployment/overview.md) — Produktion hinter NPM
