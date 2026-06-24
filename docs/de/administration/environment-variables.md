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

## GHCR-Bereitstellung

| Variable | Beschreibung |
|----------|--------------|
| `GHCR_APP_IMAGE` | z. B. `ghcr.io/finenumbers/ufw-remote-manager:v0.1.0` |
| `GHCR_MIGRATE_IMAGE` | z. B. `ghcr.io/finenumbers/ufw-remote-manager-migrate:v0.1.0` |
| `IMAGE_TAG` | Tag als Referenz in Docs/Skripten |
| `GHCR_OWNER` | GitHub-Owner (Kleinbuchstaben), z. B. `finenumbers` |

## Optional

| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| `SSH_ALLOWED_CIDRS` | Kommagetrennte CIDRs als erlaubte SSH-Ziele | Leer (private IPs blockiert) |
| `APP_BIND` | Lokale Compose-Bind-Adresse | `127.0.0.1` |
| `APP_PORT` | Host-Port für lokales Compose | `3000` |
| `POSTGRES_PORT` | Host-Port für Postgres in Dev | `5434` |
| `LOG_LEVEL` | Pino-Log-Level | `info` |

## Wie Variablen Container erreichen

In `docker-compose.yml`:

```yaml
APP_URL: ${APP_URL:-http://localhost:3000}
BETTER_AUTH_URL: ${APP_URL:-http://localhost:3000}
```

Die App liest `APP_URL` oder `BETTER_AUTH_URL` zur Laufzeit (`getPublicAppUrl()`).

## Vorlagen und Generatoren

- [`.env.example`](../../../.env.example) — lokale Entwicklung
- [`.env.production.example`](../../../.env.production.example) — Produktionsvorlage
- [`scripts/generate-production-env.sh`](../../../scripts/generate-production-env.sh) — interaktiver Generator

## Verwandte Dokumentation

- [Sicherheitsmodell](./security-model.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
