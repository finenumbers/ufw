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

- Host-Validierung blockiert SSRF zu privaten/Metadaten-Adressen
- Optionales `SSH_ALLOWED_CIDRS` für interne Netzwerke
- Host-Key-Pinning bei erster erfolgreicher Verbindung
- Importierte Keys als nicht verifiziert markiert, bis SSH-Test erfolgreich
- Command Injection verhindert durch Allowlist-Enums und sanitisierte UFW-Befehlsgenerierung

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

## Netzwerkexpositions-Checkliste

- [ ] Admin-Oberfläche nur über HTTPS-Reverse-Proxy
- [ ] Postgres in der Produktion nicht auf Host/Internet exponiert
- [ ] Admin-URL einschränken (VPN, IP-Allowlist in NPM)
- [ ] Starke eindeutige `.env`-Geheimnisse
- [ ] Regelmäßige Postgres- + `.env`-Backups off-host
- [ ] Geheimnisse rotieren, wenn Export oder `.env` geleakt sein könnte

## Fehlerbereinigung

Clientseitige Fehler aus SSH-/Anwenden-Pfaden werden bereinigt, um Stack Traces oder interne Pfade nicht preiszugeben.

## Verwandte Dokumentation

- [Umgebungsvariablen](./environment-variables.md)
- [Audit-Protokoll und Export](./audit-log-and-export.md)
- [Architektur](../architecture.md)
