# Fehlerbehebung

Symptom → wahrscheinliche Ursache → Vorgehen.

## Authentifizierung

| Symptom | Ursache | Lösung |
|---------|---------|--------|
| Redirect-Schleife bei Anmeldung | `APP_URL` stimmt nicht mit Browser-URL überein | `APP_URL` auf exakte öffentliche HTTPS-URL setzen; App neu starten |
| Anmeldung lokal ok, über Domain nicht | NPM oder Cookie-Secure-Flag | SSL in NPM erzwingen; prüfen, dass `APP_URL`-Schema `https://` ist |
| `BETTER_AUTH_SECRET is required` | `.env` nicht geladen | `--env-file .env` in Compose verwenden |
| `APP_URL must use HTTPS in production` | Nicht-HTTPS-`APP_URL` für echte Domain | `https://your-domain` verwenden; `http://localhost` nur für Smoke/CI erlaubt |
| `BETTER_AUTH_SECRET must be at least 32 characters` | Geheimnis zu kurz | Mit `openssl rand -base64 32` neu generieren |

## Docker / NPM

| Symptom | Ursache | Lösung |
|---------|---------|--------|
| NPM 502 Bad Gateway | App nicht im NPM-Netzwerk | `NPM_NETWORK` setzen; prüfen, dass `ufw-app` dem externen Netzwerk beitritt |
| Setup-Seite leicht per Brute-Force angreifbar | `TRUST_PROXY` fehlt | `TRUST_PROXY=1` setzen, wenn hinter NPM |
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
| Anwenden abgelehnt — Remote geändert | UFW zwischen Vorschau und Bestätigung geändert | **Anwenden-Vorschau** erneut ausführen (nicht Resync) |
| Teilweise-Anwenden-Warnung | Vorheriges Anwenden unterbrochen oder Sync fehlgeschlagen | Synchronisieren; Remote-`ufw status` manuell prüfen |
| Hängendes Vorgangsbanner | Veraltetes RUNNING/PENDING nach Trennung | Seite neu laden |
| Von SSH ausgesperrt | Deny-Regel angewendet | Konsolen-/Out-of-Band-Zugriff; UFW direkt auf Server korrigieren |

## Daten

| Symptom | Ursache | Lösung |
|---------|---------|--------|
| Zugangsdaten nach Wiederherstellung ungültig | Falscher `APP_ENCRYPTION_KEY` | Passende `.env` aus Backup wiederherstellen |
| Identitäten nicht entschlüsselbar | Schlüsselrotation ohne Neueingabe | Geheimnisse erneut eingeben oder Export-JSON wiederherstellen |

## Health-API

```bash
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

Erwartet: `{"status":"ok","db":"ok","version":"…"}` (`revision` nur außerhalb der Produktion)

## Immer noch hängengeblieben?

E-Mail an **[apps@finenumbers.com](mailto:apps@finenumbers.com)** mit Versions-Tag, bereinigten Logs (ohne Geheimnisse) und Reproduktionsschritten.
