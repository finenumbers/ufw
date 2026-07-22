# Schnellstart

UFW Remote Manager lokal mit Docker ausführen. Dieser Pfad dient der **Evaluation und Entwicklung**, nicht der Produktion.

## Voraussetzungen

- Docker und Docker Compose
- Git
- Port **8088** auf localhost frei (konfigurierbar über `APP_PORT`)

## 1. Klonen und konfigurieren

```bash
git clone https://github.com/finenumbers/ufw.git
cd ufw
cp .env.example .env
```

Standardwerte in `.env` funktionieren für die lokale Nutzung. Secrets sind nur für die Entwicklung vorausgefüllt — generieren Sie neue für jede geteilte oder produktive Bereitstellung.

## 2. Stack starten

```bash
docker compose up -d --build
```

Dies startet:

| Service | Rolle |
|---------|-------|
| **postgres** | PostgreSQL-Datenbank |
| **migrate** | Führt `prisma migrate deploy` einmal aus, dann Exit |
| **app** | Next.js-UI auf Port 8088 |

Status prüfen:

```bash
docker compose ps
docker compose logs -f app
```

## 3. Administratorkonto erstellen

Öffnen Sie **http://localhost:8088/setup**

- Registrierung ist **nur einmal** verfügbar — solange kein Benutzer existiert
- Nach der Einrichtung leitet `/setup` zur Anmeldung weiter
- Verwenden Sie ein starkes Passwort; dies ist das einzige Administratorkonto

## 4. SSH-Identität erstellen

1. Seitenleiste → **SSH-Identitäten** → **Identität hinzufügen**
2. Authentifizierung wählen: Passwort, privater Schlüssel oder Schlüssel mit Passphrase
3. Speichern — Zugangsdaten werden mit `APP_ENCRYPTION_KEY` verschlüsselt

Siehe [SSH-Identitäten](./concepts/ssh-identities.md).

## 5. Server hinzufügen

1. Seitenleiste → **Server** → **Server hinzufügen**
2. Name, Host, Port eingeben, Identität auswählen
3. **Server erstellen** prüft SSH automatisch

Bei Erfolg gelangen Sie zum Server-Dashboard. Das UFW-Badge zeigt den gecachten Zustand (leer bis zur ersten Aktualisierung).

## 6. Aktualisieren und mit Regeln arbeiten

1. **Status aktualisieren** klicken — Live-SSH-Lesen; erstellt ersten UFW-Snapshot
2. Wenn UFW fehlt, **UFW installieren** verwenden (nachdem die Aktualisierung bestätigt, dass UFW nicht installiert ist)
3. Wenn UFW aktiv ist, Regeln in der Tabelle bearbeiten
4. **Regeln speichern** → Vorschau prüfen → **Bestätigen**, um Änderungen zu übertragen

Wenn noch kein Snapshot existiert, kann einmalig ein automatischer Hintergrund-**Initial-Sync** laufen — siehe [Server verwalten](./user-guide/manage-servers.md).

## Optional: Portscan lokal aktivieren

In `.env` hinzufügen:

```env
PORT_SCAN_ENABLED=true
```

App-Container neu bauen/neu starten. Portscan erfordert Naabu und Nmap im Image (im offiziellen Dockerfile enthalten).

## Entwicklung ohne vollständige Docker-App

Nur Postgres in Docker, App auf dem Host:

```bash
docker compose up -d postgres
npm install
npm run db:migrate
npm run dev
```

App lauscht auf **http://localhost:8088** (siehe `package.json`).

## Stoppen und Zurücksetzen

```bash
docker compose down          # Container stoppen
docker compose down -v       # stoppen und Datenbank-Volume löschen
```

## Nächste Schritte

- [Architektur](./architecture.md)
- [Produktionsbereitstellung](./deployment/overview.md)
- [Sicherheitsmodell](./administration/security-model.md)
