# Architektur

Diese Seite beschreibt, wie UFW Remote Manager aufgebaut ist, wie Daten fließen und wo Geheimnisse liegen.

![Bereitstellungstopologie](../assets/architecture-topology.svg)

*Diagramm: Browser → Reverse Proxy → App → Postgres; App → Zielserver über SSH.*

## Komponenten

| Komponente | Rolle |
|------------|-------|
| **ufw-app** | Next.js-Anwendung (UI + API + Server Actions) |
| **ufw-postgres** | PostgreSQL — Benutzer, verschlüsselte Zugangsdaten, Regeln, Snapshots, Audit |
| **ufw-migrate** | Einmal-Container — führt `prisma migrate deploy` bei jedem Deploy aus |
| **Nginx Proxy Manager** | Externe HTTPS-Terminierung (nicht Teil dieses Stacks) |
| **Ziel-Linux-Server** | UFW-verwaltete Hosts, die über SSH erreicht werden |

## Anfragefluss (Produktion)

```mermaid
flowchart LR
  Browser -->|HTTPS| NPM[Nginx_Proxy_Manager]
  NPM -->|HTTP| App[ufw_app:3000]
  App --> DB[(PostgreSQL)]
  App -->|SSH| Server1[Linux_UFW]
  App -->|SSH| Server2[Linux_UFW]
```

1. Der Administrator öffnet `APP_URL` im Browser (HTTPS über NPM).
2. Better Auth validiert das Session-Cookie.
3. Server Actions und API-Routen orchestrieren SSH- und Datenbankarbeit.
4. UFW-Befehle laufen auf Remote-Hosts erst nach expliziter Anwenden-Bestätigung.

## Laufzeitkonfiguration

Die öffentliche URL wird zur **Laufzeit** gesetzt, nicht ins Docker-Image eingebacken:

- `APP_URL` in `.env` → `BETTER_AUTH_URL` im Container
- Ein GHCR-Image funktioniert für jede Domain — siehe [GHCR + Compose](./deployment/ghcr-compose.md)

Implementierung: `getPublicAppUrl()` in `src/lib/app-url.ts`.

## Nebenläufigkeitsmodell

- **SSH-Warteschlange pro Server** (`p-queue`, Nebenläufigkeit 1) — Vorgänge auf demselben Host werden serialisiert
- **Eine App-Replik** in der Produktion — Rate-Limits sind im Speicher
- Skalieren Sie nicht auf mehrere App-Replikas ohne gemeinsamen Rate-Limit-Speicher (z. B. Redis)

## Datenspeicherung

| Daten | Speicherort | Verschlüsselt? |
|-------|-------------|----------------|
| SSH-Passwörter / private Schlüssel | Postgres (`identity`-Tabelle) | Ja — AES-256-GCM mit `APP_ENCRYPTION_KEY` |
| UFW-Regeln, Entwürfe, Snapshots | Postgres | Nur Metadaten; Regelinhalt ist nicht geheim |
| Sitzungen | Postgres (Better Auth) | Session-Tokens; geschützt durch `BETTER_AUTH_SECRET` |
| Audit-Ereignisse | Postgres | Wer hat wann was getan |
| `.env`-Geheimnisse | Nur Host-Dateisystem | Dürfen niemals in Git liegen |

## Sicherheitsgrenzen

- Postgres wird in der Produktion **nicht** auf den Host veröffentlicht (`docker-compose.prod.yml`)
- App-Port ist im Docker-Netzwerk erreichbar (NPM + intern), in Prod nicht auf `0.0.0.0`
- SSH-Zielvalidierung blockiert private/Metadaten-IPs standardmäßig; optional `SSH_ALLOWED_CIDRS`
- Produktionsantworten enthalten CSP, HSTS und Security-Header (`next.config.ts`)

## Verwandte Dokumentation

- [Sicherheitsmodell](./administration/security-model.md)
- [Entwurf-und-Anwenden-Workflow](./concepts/draft-apply-workflow.md)
- [Umgebungsvariablen](./administration/environment-variables.md)
