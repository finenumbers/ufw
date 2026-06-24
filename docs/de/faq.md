# FAQ

## Allgemein

**Was ist UFW Remote Manager?**  
Eine selbst gehostete Web-Oberfläche zur Verwaltung von UFW-Firewalls auf Remote-Linux-Servern über SSH, mit Entwurf/Anwenden-Workflow und Audit-Protokollierung.

**Ist es kostenlos?**  
Open Source unter MIT-Lizenz. Sie stellen die Infrastruktur bereit (Docker-Host, Domain, SSL).

**Wer hat es entwickelt?**  
[Finenumbers](https://finenumbers.com) — siehe [Über Finenumbers](./about.md).

## Konten

**Kann ich mehrere Admin-Benutzer anlegen?**  
Nicht über Selbstregistrierung. Nur ein Konto wird unter `/setup` erstellt; weitere Anmeldungen sind deaktiviert.

**Ich habe mein Passwort vergessen.**  
Zurücksetzen erfordert Datenbankzugriff oder Wiederherstellung aus Backup. Es gibt keinen E-Mail-Reset in der Standardkonfiguration.

## Bereitstellung

**Brauche ich ein eigenes Docker-Image pro Domain?**  
Nein. Setzen Sie `APP_URL` in `.env` zur Laufzeit. Ein GHCR-Image funktioniert für jede HTTPS-Domain.

**Ist Nginx Proxy Manager enthalten?**  
Nein. NPM (oder ein anderer Reverse Proxy) muss separat installiert werden.

**Kann ich ohne HTTPS betreiben?**  
Lokale Entwicklung nutzt `http://localhost:8088`. Die Produktion erwartet HTTPS für sichere Cookies und HSTS.

## Firewall-Vorgänge

**Entfernt das Löschen eines Servers die Remote-UFW-Regeln?**  
Nein. Es werden nur lokale Datenbankeinträge gelöscht.

**Was passiert, wenn Anwenden halb scheitert?**  
Remote-UFW kann teilweise aktualisiert sein. Verwenden Sie **Erzwungene Synchronisation vom Server** und prüfen Sie den Vorgangsverlauf. Siehe [Entwurf-und-Anwenden-Workflow](./concepts/draft-apply-workflow.md).

**Kann ich Server in privaten IPs verwalten?**  
Ja, setzen Sie `SSH_ALLOWED_CIDRS` in `.env`, um Ihre internen Bereiche zu erlauben.

## Daten und Sicherheit

**Wo werden SSH-Schlüssel gespeichert?**  
Verschlüsselt in Postgres mit `APP_ENCRYPTION_KEY`. Der `.env`-Schlüssel ist für die Entschlüsselung zwingend erforderlich.

**Ist Konfigurationsexport sicher?**  
Der Export enthält **Geheimnisse im Klartext**. Passwort-Neueingabe ist erforderlich; bewahren Sie Exporte sicher auf.

## Support

Kontaktieren Sie **[apps@finenumbers.com](mailto:apps@finenumbers.com)** bei Produktfragen.

Sicherheitslücken: siehe [SECURITY.md](../../SECURITY.md) — keine öffentlichen GitHub-Issues eröffnen.
