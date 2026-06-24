# Fehlerbehebung

Symptom → wahrscheinliche Ursache → Vorgehen.

## Authentifizierung

| Symptom | Ursache | Lösung |
|---------|---------|--------|
| Redirect-Schleife bei Anmeldung | `APP_URL` stimmt nicht mit Browser-URL überein | `APP_URL` auf exakte öffentliche HTTPS-URL setzen; App neu starten |
| Anmeldung lokal ok, über Domain nicht | NPM oder Cookie-Secure-Flag | SSL in NPM erzwingen; prüfen, dass `APP_URL`-Schema `https://` ist |
| `BETTER_AUTH_SECRET is required` | `.env` nicht geladen | `--env-file .env` in Compose verwenden |

## Docker / NPM

| Symptom | Ursache | Lösung |
|---------|---------|--------|
| NPM 502 Bad Gateway | App nicht im NPM-Netzwerk | `NPM_NETWORK` setzen; prüfen, dass `ufw-app` dem externen Netzwerk beitritt |
| `ufw-app` unhealthy | DB down oder fehlende Geheimnisse | `docker logs ufw-app`, Postgres-Health prüfen |
| `ufw-migrate` fehlgeschlagen | Migrationsfehler | `docker logs ufw-migrate` lesen; bei Bedarf Backup wiederherstellen |
| `pull access denied` | Privates GHCR-Paket | Paketsichtbarkeit Public setzen oder `docker login ghcr.io` |

## SSH

| Symptom | Ursache | Lösung |
|---------|---------|--------|
| SSH-Test schlägt fehl | Falsche Zugangsdaten, Firewall, Host down | Identität, Port prüfen; Server erlaubt Docker-Host-IP |
| Host-Validierungsfehler | Private IP blockiert | `SSH_ALLOWED_CIDRS` für interne Netzwerke setzen |
| Host-Key geändert | Server-Neuinstallation oder MITM | Fingerabdruck auf Server verifizieren; nach Bestätigung aktualisieren |
| Nicht verifizierter Host-Key | Aus Konfiguration importiert | SSH-Test von der Server-Bearbeitungsseite ausführen |

## Regeln / Anwenden

| Symptom | Ursache | Lösung |
|---------|---------|--------|
| Regelseite leer / deaktiviert | UFW nicht aktiv | UFW vom Dashboard installieren und aktivieren |
| Vorschau zeigt unerwartete Löschungen | Entwurf-Drift | Erzwungene Synchronisation vom Server |
| Teilweise-Anwenden-Warnung | Vorheriges Anwenden unterbrochen | Synchronisieren; Remote-`ufw status` manuell prüfen |
| Von SSH ausgesperrt | Deny-Regel angewendet | Konsolen-/Out-of-Band-Zugriff; UFW direkt auf Server korrigieren |

## Daten

| Symptom | Ursache | Lösung |
|---------|---------|--------|
| Zugangsdaten nach Wiederherstellung ungültig | Falscher `APP_ENCRYPTION_KEY` | Passende `.env` aus Backup wiederherstellen |
| Identitäten nicht entschlüsselbar | Schlüsselrotation ohne Neueingabe | Geheimnisse erneut eingeben oder Export-JSON wiederherstellen |

## Health-API

```bash
docker exec ufw-app node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>r.json()).then(console.log)"
```

Erwartet: `{"status":"ok","db":"ok"}`

## Immer noch hängengeblieben?

E-Mail an **[apps@finenumbers.com](mailto:apps@finenumbers.com)** mit Versions-Tag, bereinigten Logs (ohne Geheimnisse) und Reproduktionsschritten.
