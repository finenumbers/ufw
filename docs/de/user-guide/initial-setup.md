# Ersteinrichtung

Beim ersten Start wird das einzige Administratorkonto erstellt. Danach ist die Registrierung dauerhaft deaktiviert.

## Einrichtungsseite (`/setup`)

Verfügbar, wenn **kein Benutzer** in der Datenbank existiert:

1. `http://localhost:8088/setup` öffnen (oder Ihre `APP_URL/setup`)
2. E-Mail und Passwort eingeben
3. Absenden — Sie sind angemeldet und werden zur App weitergeleitet

Wenn bereits ein Benutzer existiert, leitet `/setup` zu `/login` weiter.

## Anmeldung (`/login`)

Verwenden Sie E-Mail und Passwort aus der Einrichtung. Sessions werden von Better Auth verwaltet (HTTP-only-Cookies).

Abmelden: Seitenleiste → **Abmelden**.

## Single-Admin-Modell

Es gibt keine Benutzerverwaltungs-UI. Ein Konto pro Installation. Für geteilten Zugriff Passwort-Manager und Betriebsverfahren verwenden — nicht separate App-Benutzer.

## Setup-Ratenlimit

Setup-Versuche sind auf **5 pro Minute pro Client-IP** begrenzt, um Brute-Force bei frischen Installationen zu verlangsamen.

Wenn die App in Produktion hinter Nginx Proxy Manager läuft, setzen:

```env
TRUST_PROXY=1
```

Ohne dies nutzen Ratenlimits einen einzelnen geteilten Bucket und können hinter einem Proxy weniger genau sein.

## Erster Produktionsbesuch

1. Stack bereitstellen — siehe [Bereitstellungsübersicht](../deployment/overview.md)
2. `https://your-domain/setup` öffnen (muss `APP_URL` entsprechen)
3. Einrichtung abschließen, bevor die URL breit exponiert wird
4. [Smoke-Tests](../operations/smoke-tests.md) ausführen

## Verwandte Dokumentation

- [Schnellstart](../quick-start.md)
- [Sicherheitsmodell](../administration/security-model.md)
