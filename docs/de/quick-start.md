# Schnellstart (lokal)

UFW Remote Manager auf Ihrem Rechner mit Docker ausführen. Dieser Weg dient der **Evaluation und Entwicklung**, nicht der Produktion.

## 1. Klonen und konfigurieren

```bash
git clone https://github.com/finenumbers/ufw.git
cd ufw
cp .env.example .env
```

Die Standard-`.env` verwendet entwicklungsfreundliche Werte. Verwenden Sie diese Standardwerte **nicht** in der Produktion.

## 2. Stack starten

```bash
docker compose up -d --build
```

Warten Sie, bis alle Container healthy sind:

```bash
docker compose ps
```

Sie sollten `ufw-postgres` (healthy), `ufw-migrate` (exited 0) und `ufw-app` (healthy) sehen.

## 3. Oberfläche öffnen

Öffnen Sie **http://localhost:8088** in Ihrem Browser.

- **Erster Besuch:** `/setup` — das einzige Administratorkonto anlegen
- **Spätere Besuche:** `/login`

## 4. Erster Workflow in der Oberfläche

1. **SSH-Identitäten** (`/identities`) — Zugangsdaten anlegen (Passwort oder privater Schlüssel)
2. **Server hinzufügen** — Identität wählen, Host/Port eingeben; SSH-Test läuft vor dem Speichern
3. Auf der Serverseite — UFW bei Bedarf installieren/aktivieren, dann **Regeln** öffnen
4. Regeln bearbeiten, **Regeln speichern** mit Anwenden-Vorschau, bestätigen, um Änderungen über SSH zu übertragen

## Nützliche Befehle

```bash
docker compose logs -f app          # Anwendungslogs
docker compose down                 # Stack stoppen
docker compose down -v              # stoppen und Datenbank-Volume löschen
```

## Host-Entwicklung (optional)

Nur Postgres in Docker und die App auf dem Host ausführen:

```bash
docker compose up -d postgres
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Verwenden Sie Port **5434** in `DATABASE_URL` für Host-Zugriff (siehe `.env.example`).

## Produktion

Für HTTPS-Bereitstellung hinter Nginx Proxy Manager siehe [Bereitstellungsübersicht](./deployment/overview.md).
