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
  NPM -->|HTTP| App[ufw_app:8088]
  App --> DB[(PostgreSQL)]
  App -->|SSH| Server1[Linux_UFW]
  App -->|SSH| Server2[Linux_UFW]
```

1. Der Administrator öffnet `APP_URL` im Browser (HTTPS über NPM).
2. Better Auth validiert das Session-Cookie.
3. Server Actions und API-Routen orchestrieren SSH und Datenbankarbeit.
4. UFW-Befehle auf Remote-Hosts laufen nur nach expliziter Apply-Bestätigung.

## Runtime-Konfiguration

Die öffentliche URL wird zur **Laufzeit** gesetzt, nicht im Docker-Image:

- `APP_URL` in `.env` → `BETTER_AUTH_URL` im Container
- Ein GHCR-Image funktioniert für jede Domain — siehe [GHCR + Compose](./deployment/ghcr-compose.md)

Implementierung: `getPublicAppUrl()` in `src/lib/app-url.ts`.

**Wichtig:** `APP_URL` ist die **öffentliche HTTPS-URL**, die der Browser nutzt (über NPM). NPM leitet auf `http://ufw-app:8088` im Docker-Netzwerk weiter — internes HTTP ist **beabsichtigt**. Siehe [Nginx Proxy Manager](./deployment/nginx-proxy-manager.md).

## Server-Detail-Lademodell

Das Öffnen eines Server-Dashboards ist **cache-first** — kein SSH beim ersten Seitenaufruf:

1. **SSR** liest den neuesten UFW-**Snapshot** aus Postgres (`detectionFromSnapshot`) und rendert Status und Regeln aus der Datenbank.
2. Regeln, Port-Scan-Ergebnisse und Docker-Inventar werden **parallel** aus Postgres geladen (`Promise.all`) — weiterhin kein SSH.
3. **Refresh** (Dashboard oder Regeln-Toolbar) löst ein Live-SSH-Lesen aus und aktualisiert den Snapshot.
4. **Initial Sync** läuft automatisch im Hintergrund, wenn UFW installiert und aktiv ist, aber **noch kein Snapshot existiert** (`needsSync`).

Server-Seiten bleiben schnell; SSH-Arbeit erfolgt nur bei explizitem Refresh oder wenn noch kein Cache vorhanden ist.

## Concurrency-Modell

- **Pro-Server-SSH-Warteschlange** (`p-queue`, Concurrency 1) — Operationen auf demselben Host werden serialisiert
- **Einzelne App-Replika** in Produktion — Rate Limits im Speicher
- Nicht auf mehrere Replikas skalieren ohne gemeinsamen Rate-Limit-Speicher (z. B. Redis)

## Datenspeicherung

| Daten | Ort | Verschlüsselt? |
|-------|-----|----------------|
| SSH-Passwörter / private Keys | Postgres (`identity`-Tabelle) | Ja — AES-256-GCM mit `APP_ENCRYPTION_KEY` |
| UFW-Regeln, Entwürfe, Snapshots | Postgres | Nur Metadaten; Regelinhalt ist nicht geheim |
| Sessions | Postgres (Better Auth) | Session-Tokens; geschützt durch `BETTER_AUTH_SECRET` |
| Audit-Ereignisse | Postgres | Wer hat wann was getan |
| `.env`-Geheimnisse | Nur Host-Dateisystem | Niemals in Git |

## Sicherheitsgrenzen

- Postgres wird in Produktion **nicht** auf den Host veröffentlicht (`docker-compose.prod.yml`)
- App-Port ist im Docker-Netzwerk erreichbar (NPM + intern), nicht auf `0.0.0.0` in Prod
- SSH-Zielvalidierung blockiert private/Metadata-IPs standardmäßig; optional `SSH_ALLOWED_CIDRS`
- Produktionsantworten enthalten CSP, HSTS und Security-Header (`next.config.ts`)

## Verwandte Dokumentation

- [Sicherheitsmodell](./administration/security-model.md)
- [Entwurf-und-Apply-Workflow](./concepts/draft-apply-workflow.md)
- [Umgebungsvariablen](./administration/environment-variables.md)
