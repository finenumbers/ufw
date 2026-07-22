# Sicherheitsmodell

UFW Remote Manager ist ein **privilegiertes Admin-Tool**: Es speichert SSH-Secrets, führt Remote-Firewall-Befehle aus und exponiert eine Web-UI. Designannahmen und Kontrollen sind hier dokumentiert.

## Threat Model (Zusammenfassung)

| Asset | Risiko | Minderung |
|-------|--------|-----------|
| SSH-Zugangsdaten | Offenlegung | AES-256-GCM at rest; nur für Verbindungen entschlüsselt |
| Session-Cookie | Hijacking | HTTPS, HTTP-only-Cookies, `BETTER_AUTH_SECRET` |
| Host-Impersonation | MITM auf SSH | Host-Key-Fingerabdruck beim ersten Connect; nicht verifiziert blockiert Apply |
| Unbefugter Admin | Brute-Force | Ein Benutzer; Setup-Ratenlimit; starke Passwörter |
| CSRF / XSS | Kontomissbrauch | Framework-Defaults, CSP in Produktion |
| Konfigurationsexport-Datei | Secret-Leak | Passwort-Step-up; Verantwortung des Betreibers |

Die App implementiert **keine** Pro-Server-ACLs — jeder angemeldete Admin kann alle Server verwalten.

## Authentifizierung

- Better Auth E-Mail/Passwort-Sessions
- Registrierung nach erstem Benutzer deaktiviert (`/setup` einmal)
- Abmelden löscht Session; An-/Abmeldung auditiert

Nur über **HTTPS** in Produktion betreiben (`APP_URL` muss https verwenden, außer localhost).

## Verschlüsselung at rest

| Secret | Key |
|--------|-----|
| Identitäts-Passwörter und Schlüssel | `APP_ENCRYPTION_KEY` (32 Bytes) |
| Session-Signierung | `BETTER_AUTH_SECRET` (min. 32 Zeichen in Prod) |

Rotieren von `APP_ENCRYPTION_KEY` ohne Re-Import der Identitäten macht gespeicherten Ciphertext unbrauchbar.

## Netzwerk-Exposure

Produktions-Compose (`docker-compose.prod.yml`):

- Postgres **nicht** auf Host veröffentlicht
- App lauscht im Docker-Netzwerk für NPM
- Ziel-SSH vom App-Container zu verwalteten Servern

TLS terminiert bei **Nginx Proxy Manager**. Internes HTTP zwischen NPM und `ufw-app` ist beabsichtigt — siehe [Nginx Proxy Manager](../deployment/nginx-proxy-manager.md).

## SSH-Sicherheit

- Standard-Block auf private/Metadaten-Ziel-IPs
- Optional `SSH_ALLOWED_CIDRS` für Lab/VPN
- Host-Key TOFU — siehe [Server und SSH](../concepts/servers-and-ssh.md)
- Apply blockiert bis Host-Key verifiziert

## Anwendungshärtung

Produktions-HTTP-Header (CSP, HSTS usw.) über `next.config.ts`.

Health-Endpunkt `/api/health` exponiert Version — keine Secrets.

## Audit

Sensible Aktionen schreiben `auditEvent`-Zeilen: Anmeldung, Abmeldung, Apply, Snapshot, Portscan, Konfigurationsexport, Server-Änderungen. Siehe [Audit-Log und Export](./audit-log-and-export.md).

## Einzelne Replik

Ratenlimits und Warteschlangen sind **In-Memory**. Mehrere App-Repliken ohne geteilten Zustand schwächen Ratenlimit- und Warteschlangen-Garantien.

## Schwachstellen melden

Siehe [SECURITY.md](../../../SECURITY.md) im Repository-Root (Englisch).

## Verwandte Dokumentation

- [Umgebungsvariablen](./environment-variables.md)
- [Architektur](../architecture.md)
