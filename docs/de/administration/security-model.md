# Sicherheitsmodell

Diese Seite erklärt, wie UFW Remote Manager Zugangsdaten, Sitzungen und Netzgrenzen schützt.

Für Schwachstellenmeldungen siehe [SECURITY.md](../../../SECURITY.md) (Englisch, kanonisch).

## Authentifizierung

- **Better Auth** with email/password
- Single admin account after initial setup — no public registration
- Session cookies; `BETTER_AUTH_SECRET` required in production
- Rate limiting on auth endpoints (in-memory, single replica)

## Verschlüsselung von Zugangsdaten

SSH passwords and private keys are encrypted with **AES-256-GCM** before storage.

| Secret | Purpose |
|--------|---------|
| `APP_ENCRYPTION_KEY` | Encrypts/decrypts identity secrets (32 bytes, base64) |
| `BETTER_AUTH_SECRET` | Signs session tokens |

**If `APP_ENCRYPTION_KEY` is lost, encrypted SSH credentials cannot be recovered** — only re-entered manually or restored from config export backup.

## SSH-Sicherheit

- Host validation blocks SSRF to private/metadata addresses at save time
- **DNS resolution check:** before each SSH connect and port scan, the resolved IP is validated again — blocks DNS rebinding to private/metadata addresses even when the hostname looked safe at save time
- Optional `SSH_ALLOWED_CIDRS` for internal networks
- Host-Key-Pinning beim ersten erfolgreichen **Status aktualisieren** (SSH-Verbindung) oder bei erfolgreichem Speichern beim Anlegen/Aktualisieren eines Servers
- Config-Import pinnt Host-Keys **nicht** automatisch — importierte Server bleiben `sshHostKeyVerified: false`, bis der Operator Status aktualisieren ausführt
- Apply und UFW-Installation sind blockiert, bis der Host-Key verifiziert ist
- **TOFU-Restrisiko:** erstes Status aktualisieren vertraut dem dann präsentierten Key (Standard-SSH-TOFU). Ein Angreifer mit Netzwerk-Kontrolle beim ersten Connect könnte einen bösartigen Key pinnen; für kritische Hosts Fingerprint out-of-band prüfen
- Command injection prevented via allowlisted enums and sanitized UFW command building

## Externes Port-Scanning (optional)

When `PORT_SCAN_ENABLED=true`:

- Scans run **only** toward `Server.host` records already in the database
- Hostnames are resolved to IPv4 and validated with the same rules as SSH (**no scan without a validated resolved IP**)
- Naabu + Nmap execute inside `ufw-app` (connect scans, no arbitrary targets)
- Rate-limited per server; audit events recorded
- Requires **network egress** from the app container to managed hosts on scanned ports — see [Port-Scanning](../deployment/port-scan.md)

## Docker-Monitoring (optional)

When `DOCKER_MONITOR_ENABLED=true`:

- Inventory and control run over **SSH** on registered servers only
- Container references validated; only `START` / `STOP` / `RESTART` actions
- Rate limits and audit events on refresh and control
- SSH user needs Docker CLI access — see [Docker-Monitoring](../deployment/docker-monitor.md)

## Schutz bei Anwenden und Export

- UFW changes require **preview + explicit confirm**
- Regel-Fingerprints werden beim Apply-Preview **serverseitig neu berechnet** — manipulierte Client-Fingerprints können Plan-Items nicht umzuordnen
- Config export requires **password re-entry** and writes `CONFIG_EXPORT` audit event
- Config-Import erfordert **Passwort erneut eingeben** (gleiche Rate Limits wie Export)
- Export files contain **plaintext secrets** — operator responsibility

## HTTP-Security-Header (Produktion)

When `NODE_ENV=production`:

- Content-Security-Policy
- Strict-Transport-Security (HSTS)
- X-Frame-Options, X-Content-Type-Options, Referrer-Policy

TLS terminates at Nginx Proxy Manager; app receives HTTP on the Docker network.

### Hinweis zu Content-Security-Policy

The current CSP includes `'unsafe-inline'` and `'unsafe-eval'` for Next.js App Router scripts and hydration. Nonce-based CSP is deferred until Next.js supports it without breaking client bundles. Do not remove these directives without a full regression pass.

## Öffentliche Endpunkte

| Path | Auth | Notes |
|------|------|-------|
| `/api/health` | None | Returns `status`, `db`, `version`; `revision` (git/build id) only in non-production |
| `/setup` | None (once) | Rate-limited; use `TRUST_PROXY=1` behind NPM |

## Rate Limiting für Setup

Initial admin registration (`/setup`) is limited to **5 attempts per minute** per client IP when `TRUST_PROXY=1`, otherwise per direct connection bucket.

## Checkliste Netzwerk-Exposition

- [ ] Admin UI only via HTTPS reverse proxy
- [ ] Postgres not exposed to host/internet in production
- [ ] Restrict admin URL (VPN, IP allowlist in NPM)
- [ ] Strong unique `.env` secrets
- [ ] Regular Postgres + `.env` backups off-host
- [ ] Rotate secrets if export or `.env` may have leaked

## Fehler-Sanitisierung

Client-facing errors from SSH/apply paths are sanitized to avoid leaking stack traces or internal paths.

Expired sessions return a consistent message from server actions: `Session expired. Please sign in again.` (no raw `Unauthorized` propagated to the UI).

## Verwandte Dokumentation

- [Umgebungsvariablen](./environment-variables.md)
- [Audit-Log und Export](./audit-log-and-export.md)
- [Architektur](../architecture.md)
