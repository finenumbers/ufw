# Umgebungsvariablen

Die Laufzeitkonfiguration wird über `.env` (Compose) oder die Portainer-Umgebungsoberfläche bereitgestellt. **Niemals echte Werte in Git committen.**

## Erforderlich (Produktion)

| Variable | Beschreibung | Generieren |
|----------|--------------|------------|
| `APP_URL` | Öffentliche URL der Admin-Oberfläche (HTTPS für echte Domains) | Ihre NPM-Domain, z. B. `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Datenbankpasswort | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Session-Signiergeheimnis (**mind. 32 Zeichen** in der Produktion) | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | AES-Schlüssel für SSH-Zugangsdaten (32 dekodierte Bytes) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Docker-Netzwerkname, gemeinsam mit NPM | `docker network ls` |

## GHCR-Bereitstellung (optional)

Compose und Portainer-Stack verwenden standardmäßig `ghcr.io/finenumbers/ufw-remote-manager:latest`. Jeder GitHub-Release aktualisiert den Tag `latest`.

| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| `GHCR_OWNER` | GitHub-Owner (Kleinbuchstaben) | `finenumbers` |
| `GHCR_IMAGE_TAG` | Image-Tag (`latest` oder Fixierung z. B. `v0.2.1`) | `latest` |

Legacy-Variablen `GHCR_APP_IMAGE` / `GHCR_MIGRATE_IMAGE` / `IMAGE_TAG` sind nicht mehr erforderlich — Image-URLs werden aus Owner + Tag in den Compose-Dateien gebaut.

## Optional

| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| `SSH_ALLOWED_CIDRS` | Kommagetrennte CIDRs als erlaubte SSH-Ziele | Leer (private IPs blockiert) |
| `TRUST_PROXY` | Auf `1` setzen, wenn die App hinter Nginx Proxy Manager läuft, damit Setup-Rate-Limits `X-Forwarded-For` verwenden | Nicht gesetzt (Forwarded-Header werden ignoriert) |
| `APP_BIND` | Lokale Compose-Bind-Adresse | `127.0.0.1` |
| `APP_PORT` | Host-Port für lokales Compose | `8088` |
| `POSTGRES_PORT` | Host-Port für Postgres in Dev | `5434` |
| `LOG_LEVEL` | Pino-Log-Level | `info` |

## Rate Limits (fest)

Wiederholte Server-Aktionen haben eine **30 Sekunden**-Abklingzeit pro Server (nicht über Umgebungsvariablen konfigurierbar):

- UFW-Status-Refresh und Regel-Sync
- Port-Scan-Start

Seit **v0.5.1** werden Legacy-Variablen wie `PORT_SCAN_RATE_LIMIT_WINDOW_MS` **ignoriert**, falls sie noch in `.env` stehen.

In-Memory-Rate-Limit-Buckets werden bei Leerstand entfernt (nur Single-Replica-Bereitstellung — siehe [Architektur](../architecture.md)).

## APP_URL vs. internes HTTP

Zwei verschiedene URLs erfüllen unterschiedliche Rollen:

| Einstellung | Beispiel | Zweck |
|-------------|----------|-------|
| **`APP_URL`** | `https://ufw.example.com` | Öffentliche URL für Better Auth, Cookies und Browser-Weiterleitungen |
| **NPM Proxy Host scheme** | `http` → `ufw-app:8088` | Interner Docker-Traffic; NPM terminiert TLS |

Setzen Sie **`APP_URL` nicht** auf die interne Container-URL. Better Auth benötigt die öffentliche HTTPS-Domain, die Benutzer im Browser eingeben.

In der Produktion muss `APP_URL` für echte Hostnamen **HTTPS** verwenden. Ausnahmen: `http://localhost` und `http://127.0.0.1` (lokale Smoke-Tests und CI).

## Produktion hinter NPM

Wenn `ufw-app` hinter Nginx Proxy Manager in einem gemeinsamen Docker-Netzwerk läuft:

1. Setzen Sie `TRUST_PROXY=1` in der App-Umgebung, damit `/setup`-Rate-Limits die Client-IP aus `X-Forwarded-For` verwenden (NPM setzt diesen Header).
2. Ohne `TRUST_PROXY` verwenden Setup-Limits einen einzigen gemeinsamen Bucket (`direct`) — akzeptabel für lokale Entwicklung, nicht ideal für die Produktion.

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
