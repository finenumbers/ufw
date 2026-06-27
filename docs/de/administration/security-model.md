# Sicherheitsmodell

Diese Seite erklärt, wie UFW Remote Manager Zugangsdaten, Sitzungen und Netzwerkgrenzen schützt.

Zur Meldung von Schwachstellen siehe [SECURITY.md](../../../SECURITY.md) (Englisch, kanonisch).

## Authentifizierung

- **Better Auth** mit E-Mail/Passwort
- Ein Admin-Konto nach Ersteinrichtung — keine öffentliche Registrierung
- Session-Cookies; `BETTER_AUTH_SECRET` in der Produktion erforderlich
- Rate-Limiting auf Auth-Endpunkten (In-Memory, eine Replik)

## Zugangsdaten-Verschlüsselung

SSH-Passwörter und private Schlüssel werden vor der Speicherung mit **AES-256-GCM** verschlüsselt.

| Geheimnis | Zweck |
|-----------|-------|
| `APP_ENCRYPTION_KEY` | Verschlüsselt/entschlüsselt Identitätsgeheimnisse (32 Bytes, Base64) |
| `BETTER_AUTH_SECRET` | Signiert Session-Tokens |

**Geht `APP_ENCRYPTION_KEY` verloren, können verschlüsselte SSH-Zugangsdaten nicht wiederhergestellt werden** — nur manuell neu eingegeben oder aus Konfigurationsexport-Backup wiederhergestellt.

## SSH-Sicherheit

- Host-Validierung blockiert SSRF zu privaten/Metadaten-Adressen beim Speichern
- **DNS-Auflösungsprüfung:** vor jeder SSH-Verbindung und jedem Port-Scan wird die aufgelöste IP erneut validiert — blockiert DNS-Rebinding zu privaten/Metadaten-Adressen, auch wenn der Hostname beim Speichern harmlos wirkte
- Optionales `SSH_ALLOWED_CIDRS` für interne Netzwerke
- Host-Key-Pinning bei erster erfolgreicher Verbindung
- Importierte Keys als nicht verifiziert markiert, bis SSH-Test erfolgreich
- Command Injection verhindert durch Allowlist-Enums und sanitisierte UFW-Befehlsgenerierung

## Externes Port-Scanning (optional)

Bei `PORT_SCAN_ENABLED=true`:

- Scans laufen **nur** gegen `Server.host`-Einträge, die bereits in der Datenbank stehen
- Hostnamen werden in IPv4 aufgelöst und mit denselben Regeln wie SSH validiert (**kein Scan ohne validierte IP**)
- Naabu + Nmap laufen innerhalb von `ufw-app` (Connect-Scans, keine beliebigen Ziele)
- Rate-Limit pro Server; Audit-Ereignisse werden protokolliert
- Erfordert **Netzwerk-Egress** vom App-Container zu verwalteten Hosts auf gescannten Ports — siehe [Port-Scanning](../deployment/port-scan.md)

## Docker-Monitoring (optional)

Bei `DOCKER_MONITOR_ENABLED=true`:

- Inventar und Steuerung laufen über **SSH** nur auf registrierten Servern
- Container-Referenzen werden validiert; nur Aktionen `START` / `STOP` / `RESTART`
- Rate Limits und Audit-Ereignisse bei Refresh und Steuerung
- SSH-Benutzer benötigt Docker-CLI-Zugriff — siehe [Docker-Monitoring](../deployment/docker-monitor.md)

## Schutz beim Anwenden und Exportieren

- UFW-Änderungen erfordern **Vorschau + explizite Bestätigung**
- Konfigurationsexport erfordert **Passwort-Neueingabe** und schreibt `CONFIG_EXPORT`-Audit-Ereignis
- Exportdateien enthalten **Geheimnisse im Klartext** — Verantwortung des Betreibers

## HTTP-Security-Header (Produktion)

Bei `NODE_ENV=production`:

- Content-Security-Policy
- Strict-Transport-Security (HSTS)
- X-Frame-Options, X-Content-Type-Options, Referrer-Policy

TLS terminiert bei Nginx Proxy Manager; die App empfängt HTTP im Docker-Netzwerk.

### Hinweis zur Content-Security-Policy

Die aktuelle CSP enthält `'unsafe-inline'` und `'unsafe-eval'` für Next.js App Router-Skripte und Hydration. Nonce-basierte CSP ist zurückgestellt, bis Next.js sie ohne Bruch der Client-Bundles unterstützt. Entfernen Sie diese Direktiven nicht ohne vollständigen Regressionstest.

## Öffentliche Endpunkte

| Pfad | Auth | Hinweise |
|------|------|----------|
| `/api/health` | Keine | Gibt `status`, `db`, `version` zurück; `revision` (Git/Build-ID) nur außerhalb der Produktion |
| `/setup` | Keine (einmalig) | Rate-limited; `TRUST_PROXY=1` hinter NPM verwenden |

## Setup-Rate-Limiting

Die anfängliche Admin-Registrierung (`/setup`) ist auf **5 Versuche pro Minute** pro Client-IP begrenzt, wenn `TRUST_PROXY=1` gesetzt ist, andernfalls pro Direct-Connection-Bucket.

## Netzwerkexpositions-Checkliste

- [ ] Admin-Oberfläche nur über HTTPS-Reverse-Proxy
- [ ] Postgres in der Produktion nicht auf Host/Internet exponiert
- [ ] Admin-URL einschränken (VPN, IP-Allowlist in NPM)
- [ ] Starke eindeutige `.env`-Geheimnisse
- [ ] Regelmäßige Postgres- + `.env`-Backups off-host
- [ ] Geheimnisse rotieren, wenn Export oder `.env` geleakt sein könnte

## Fehlerbereinigung

Clientseitige Fehler aus SSH-/Anwenden-Pfaden werden bereinigt, um Stack Traces oder interne Pfade nicht preiszugeben.

Abgelaufene Sitzungen liefern eine einheitliche Meldung aus Server Actions: `Session expired. Please sign in again.` (kein rohes `Unauthorized` wird an die UI weitergegeben).

## Verwandte Dokumentation

- [Umgebungsvariablen](./environment-variables.md)
- [Audit-Protokoll und Export](./audit-log-and-export.md)
- [Architektur](../architecture.md)
