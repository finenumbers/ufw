# Umgebungsvariablen

Laufzeitkonfiguration über `.env` (Compose) oder Portainer-Umgebungs-UI. **Niemals echte Werte in Git committen.**

## Erforderlich (Produktion)

| Variable | Beschreibung | Generieren |
|----------|--------------|------------|
| `APP_URL` | Öffentliche HTTPS-URL der Admin-UI | Ihre NPM-Domain, z. B. `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Datenbankpasswort | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Session-Signierung (**min. 32 Zeichen** in Produktion) | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | AES-Key für SSH-Zugangsdaten (32 dekodierte Bytes) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Docker-Netzwerk geteilt mit NPM | `docker network ls` |
| `TRUST_PROXY` | Auf `1` setzen hinter NPM für genaue Setup-Ratenlimits | `1` |

## GHCR-Bereitstellung

Standard-Image: `ghcr.io/finenumbers/ufw-remote-manager:latest` (bei jedem Release aktualisiert).

| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| `GHCR_OWNER` | GitHub-Owner (Kleinbuchstaben) | `finenumbers` |
| `GHCR_IMAGE_TAG` | Tag (`latest` oder Pin z. B. `v0.9.2`) | `latest` |

`GHCR_IMAGE_TAG=v0.9.2` pinnen für reproduzierbare Deploys; `latest` für automatische Updates bei `pull`.

Legacy `GHCR_APP_IMAGE` / `GHCR_MIGRATE_IMAGE` / `IMAGE_TAG` werden nicht mehr verwendet.

## Portscan (optional)

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `PORT_SCAN_ENABLED` | unset (deaktiviert) | Auf `true` setzen für UI und Pipeline |
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | Max. Ports an Nmap-Anreicherung |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `1800000` | Discovery-Timeout (30 Min.) |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Anreicherungs-Timeout (10 Min.) |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | Gespeicherte Scan-Läufe pro Server |

Legacy `PORT_SCAN_RATE_LIMIT_WINDOW_MS` wird **ignoriert**. Wiederholte Scans nutzen feste **30-Sekunden**-Cooldown im App-Code.

## SSH und Proxy

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `SSH_ALLOWED_CIDRS` | leer | Kommagetrennte CIDRs als SSH-Ziele erlaubt |
| `TRUST_PROXY` | unset | `1` = `X-Forwarded-For` für Setup-Ratenlimit vertrauen |

## Lokale Entwicklung

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `APP_BIND` | `127.0.0.1` | Compose-Bind-Adresse |
| `APP_PORT` | `8088` | Host-Port |
| `POSTGRES_PORT` | `5434` | Host-Postgres-Port |
| `LOG_LEVEL` | `info` | Pino-Log-Level |

## Entfernt / ignoriert (historisch)

| Variable | Status |
|----------|--------|
| Legacy Container-Inventar-Env-Flags (pre-v0.9.0) | Ignoriert — Funktion in v0.9.0 entfernt |
| `PORT_SCAN_RATE_LIMIT_WINDOW_MS` | Seit v0.5.1 ignoriert |

## Ratenlimits (fest im Code)

30-Sekunden-Cooldown pro Server: UFW-Refresh/Sync, Portscan-Start. Nicht über Env konfigurierbar.

In-Memory-Buckets — nur einzelne Replik. Siehe [Architektur](../architecture.md).

## APP_URL vs. internes HTTP

| Einstellung | Beispiel | Zweck |
|-------------|----------|-------|
| **`APP_URL`** | `https://ufw.example.com` | Browser-URL, Better-Auth-Cookies |
| **NPM → app** | `http://ufw-app:8088` | Interner Docker-Traffic |

`APP_URL` **nicht** auf interne Container-URL setzen.

Produktion erfordert **HTTPS** auf `APP_URL`, außer `localhost` / `127.0.0.1`.

## Wie Variablen Container erreichen

```yaml
APP_URL: ${APP_URL:-http://localhost:8088}
BETTER_AUTH_URL: ${APP_URL:-http://localhost:8088}
```

App liest `APP_URL` oder `BETTER_AUTH_URL` über `getPublicAppUrl()`.

## Vorlagen

- [`.env.example`](../../../.env.example) — lokale Entwicklung
- [`.env.production.example`](../../../.env.production.example) — Produktionsvorlage
- [`scripts/generate-production-env.sh`](../../../scripts/generate-production-env.sh) — interaktiver Generator

## Verwandte Dokumentation

- [Sicherheitsmodell](./security-model.md)
- [Externer Portscan](../deployment/port-scan.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
