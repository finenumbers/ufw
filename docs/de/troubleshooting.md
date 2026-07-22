# Fehlerbehebung

Symptom → wahrscheinliche Ursache → Lösung. Für Konzepte siehe verlinkte Dokumentation.

## Authentifizierung und Einrichtung

| Symptom | Ursache | Lösung |
|---------|---------|--------|
| `/setup` leitet zur Anmeldung weiter | Benutzer existiert bereits | `/login` verwenden |
| Anmeldung schlägt nach Deploy fehl | Falsche `APP_URL` oder HTTP statt HTTPS | NPM-Domain anpassen; `APP_URL=https://...` setzen |
| Setup-Ratenlimit zu aggressiv | `TRUST_PROXY` fehlt hinter NPM | `TRUST_PROXY=1` setzen |

## SSH und Server erstellen

| Symptom | Ursache | Lösung |
|---------|---------|--------|
| Private IP abgelehnt | Host-Validierung | Öffentliche IP/Hostname oder `SSH_ALLOWED_CIDRS` verwenden |
| Verbindung abgelehnt | Firewall, falscher Port, Host down | Vom Docker-Host prüfen: `ssh -p PORT user@host` |
| Auth fehlgeschlagen | Falsche Identitäts-Zugangsdaten | Identität bearbeiten; Secret erneut eingeben |
| Host-Key-Warnung | Erster Connect oder Server neu aufgebaut | **Status aktualisieren**, um neuen Fingerabdruck zu erfassen |

## UFW und Regeln

| Symptom | Ursache | Lösung |
|---------|---------|--------|
| Anwenden deaktiviert | Nicht verifizierter Host-Key | **Status aktualisieren** |
| Apply nach Vorschau abgelehnt | Remote-UFW geändert | **Regeln speichern** (Vorschau) erneut |
| Teilweises Anwenden | Unterbrochene Befehle oder Sync-Fehler | **Erzwungene Synchronisation vom Server**; Vorgangsverlauf prüfen |
| Vorschau zeigt unerwartete Löschungen | Entwurf-Drift | **Erzwungene Synchronisation vom Server** |
| Regeln tauchen nach Löschen auf dem Server wieder auf | Veralteter Sync (vor v0.9.2) | Auf v0.9.2+ upgraden; erzwungene Synchronisation |
| Aus SSH ausgesperrt | Deny-Regel angewendet | Konsolenzugang; UFW out-of-band korrigieren |

## Vorgangsbanner

| Symptom | Ursache | Lösung |
|---------|---------|--------|
| Banner LÄUFT für immer | Browser während Vorgang getrennt | Seite aktualisieren; auf Sweeper warten |
| Tabelle nach Sync veraltet | Vorgangsende nicht erkannt (selten nach v0.9.2) | Browser aktualisieren |
| Idle-API-Traffic | Alte Version pollt endlos | Auf v0.9.2 upgraden — Idle-Poll stoppt |

## Portscan

| Symptom | Ursache | Lösung |
|---------|---------|--------|
| Panel fehlt | Feature deaktiviert | `PORT_SCAN_ENABLED=true` |
| Scan-Timeout fehlgeschlagen | Großer Portbereich / langsames Netzwerk | `PORT_SCAN_*_TIMEOUT_MS` erhöhen; Egress prüfen |
| Scan-läuft-bereits-Fehler | Overlap-Schutz | Auf aktuellen Scan warten |
| Keine Funde | Alle Ports gefiltert/geschlossen | Erwartet; Scan-Status ERFOLG prüfen |
| Fortschritt nach Refresh verloren (alt) | SSR lud nur ERFOLG-Scans | Auf v0.9.2 upgraden |

## Docker und Migrate

| Symptom | Ursache | Lösung |
|---------|---------|--------|
| `EACCES` Prisma in App | Falscher Container | `docker compose run --rm migrate` |
| Migrate schlägt beim Upgrade fehl | DB-Berechtigungen oder alte Version | `docker compose logs migrate` prüfen |
| App unhealthy | Falsche Secrets oder DB down | Logs: `docker compose logs app` |

## Konfigurations-Import/Export

| Symptom | Ursache | Lösung |
|---------|---------|--------|
| Import blockiert | Aktive Vorgänge auf Server | Warten bis Warteschlange idle |
| Export ratenlimitiert | Zu viele Versuche | 60 Sekunden warten |
| Entschlüsselte Secrets nach Restore verstümmelt | Falscher `APP_ENCRYPTION_KEY` | Passende `.env` wiederherstellen |

## Verwandte Dokumentation

- [FAQ](./faq.md)
- [Vorgänge und Nebenläufigkeit](./concepts/operations-and-concurrency.md)
- [Umgebungsvariablen](./administration/environment-variables.md)
