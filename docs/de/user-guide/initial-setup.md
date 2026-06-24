# Ersteinrichtung

Beim ersten Start hat UFW Remote Manager **keine Benutzer**. Sie müssen einmal das Administratorkonto anlegen.

## Einrichtungsseite (`/setup`)

1. Anwendungs-URL öffnen (z. B. `http://localhost:3000` oder Ihre `APP_URL`)
2. Sie werden automatisch zu `/setup` weitergeleitet
3. Name, E-Mail, Passwort und Passwortbestätigung eingeben
4. **Einrichtung abschließen** klicken

Nach Erfolg sind Sie angemeldet und werden zur Serverliste weitergeleitet.

## Einzeladministrator-Richtlinie

Die Registrierung ist **deaktiviert**, sobald das erste Konto existiert. Es gibt keine Self-Service-Anmeldung für zusätzliche Benutzer in der aktuellen Version.

Um eine weitere Person hinzuzufügen, würde diese die Admin-Zugangsdaten teilen (nicht empfohlen) oder Sie betreiben ein Admin-Konto pro Instanz.

## Sitzung und Anmeldung

- Sitzungen dauern **7 Tage** mit gleitender Verlängerung
- Abmelden über **Abmelden** in der Seitenleiste
- Anmeldeseite: `/login`

## Erster Start in der Produktion

Nach Bereitstellung hinter HTTPS:

1. NPM Proxy Host konfigurieren → `ufw-app:3000`
2. `APP_URL=https://your-domain.example` in `.env` setzen
3. `https://your-domain.example/setup` öffnen
4. Einrichtung abschließen, bevor Sie die URL breit verfügbar machen

Smoke-Test nach der Einrichtung ausführen:

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

## Verwandte Dokumentation

- [Schnellstart](../quick-start.md)
- [Sicherheitsmodell](../administration/security-model.md)
