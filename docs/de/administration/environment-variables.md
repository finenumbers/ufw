# Umgebungsvariablen

Die Laufzeitkonfiguration wird über `.env` (Compose) oder die Portainer-Umgebungsoberfläche bereitgestellt. **Niemals echte Werte in Git committen.**

## Erforderlich (Produktion)

| Variable | Beschreibung | Generieren |
|----------|--------------|------------|
| `APP_URL` | Öffentliche HTTPS-URL der Admin-Oberfläche | Ihre NPM-Domain, z. B. `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Datenbankpasswort | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Session-Signiergeheimnis | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | AES-Schlüssel für SSH-Zugangsdaten (32 dekodierte Bytes) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Docker-Netzwerkname, gemeinsam mit NPM | `docker network ls` |

## GHCR-Bereitstellung (optional)

Compose und Portainer-Stack verwenden standardmäßig `ghcr.io/finenumbers/ufw-remote-manager:latest`. Jeder GitHub-Release aktualisiert den Tag `latest`.

| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| `GHCR_OWNER` | GitHub-Owner (Kleinbuchstaben) | `finenumbers` |
| `GHCR_IMAGE_TAG` | Image-Tag (`latest` oder z. B. `v0.2.1`) | `latest` |

## Optional

| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| `SSH_ALLOWED_CIDRS` | Kommagetrennte CIDRs als erlaubte SSH-Ziele | Leer (private IPs blockiert) |
| `APP_BIND` | Lokale Compose-Bind-Adresse | `127.0.0.1` |
| `APP_PORT` | Host-Port für lokales Compose | `8088` |
| `POSTGRES_PORT` | Host-Port für Postgres in Dev | `5434` |
| `LOG_LEVEL` | Pino-Log-Level | `info` |

## Rate Limits (fest)

Wiederholte Server-Aktionen haben eine **30 Sekunden**-Abklingzeit pro Server (nicht über Umgebungsvariablen konfigurierbar):

- UFW-Status-Refresh und Regel-Sync
- Port-Scan-Start
- Docker-Inventar-Refresh
- Docker-Container start, stop, restart

Seit **v0.5.1** werden Legacy-Variablen wie `PORT_SCAN_RATE_LIMIT_WINDOW_MS`, `DOCKER_REFRESH_RATE_LIMIT_WINDOW_MS` und `DOCKER_CONTROL_RATE_LIMIT_WINDOW_MS` **ignoriert**, falls sie noch in `.env` stehen.

## Wie Variablen Container erreichen

In `docker-compose.yml`:

```yaml
APP_URL: ${APP_URL:-http://localhost:8088}
BETTER_AUTH_URL: ${APP_URL:-http://localhost:8088}
```

Die App liest `APP_URL` oder `BETTER_AUTH_URL` zur Laufzeit (`getPublicAppUrl()`).

## Vorlagen und Generatoren

- [`.env.example`](../../../.env.example) — lokale Entwicklung
- [`.env.production.example`](../../../.env.production.example) — Produktionsvorlage
- [`scripts/generate-production-env.sh`](../../../scripts/generate-production-env.sh) — interaktiver Generator

## Verwandte Dokumentation

- [Sicherheitsmodell](./security-model.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
