# UFW Remote Manager — Dokumentation (Deutsch)

Vollständiger Leitfaden für Administratoren und Betreiber. Abgestimmt auf **v0.9.2**.

## Erste Schritte

| Dokument | Beschreibung |
|----------|--------------|
| [Einführung](./introduction.md) | Produktumfang, Anforderungen, was die App nicht leistet |
| [Schnellstart](./quick-start.md) | Lokales Docker-Setup in wenigen Minuten |
| [Architektur](./architecture.md) | Komponenten, Cache-first-SSR, Datenmodell, Nebenläufigkeit |

## Konzepte

| Dokument | Beschreibung |
|----------|--------------|
| [SSH-Identitäten](./concepts/ssh-identities.md) | Verschlüsselte, wiederverwendbare Zugangsdaten |
| [Server und SSH](./concepts/servers-and-ssh.md) | Host-Validierung, Host-Keys, Verifizierung |
| [UFW-Regeln und Zustände](./concepts/ufw-rules-and-states.md) | Regelmodell und Origin-State-Farben |
| [Entwurf-und-Anwenden-Workflow](./concepts/draft-apply-workflow.md) | Bearbeiten, Vorschau, Bestätigen, Anwenden über SSH |
| [Konfiguration importieren und exportieren](./concepts/import-export-config.md) | Vollständiges JSON-v2-Backup |
| [Vorgänge und Nebenläufigkeit](./concepts/operations-and-concurrency.md) | Banner, Polling, Warteschlangen, Ratenlimits |

## Benutzerhandbuch

| Dokument | Beschreibung |
|----------|--------------|
| [Ersteinrichtung](./user-guide/initial-setup.md) | Erstes Administratorkonto und Anmeldung |
| [Server verwalten](./user-guide/manage-servers.md) | Hinzufügen, Bearbeiten, Löschen; Dashboard und Sync |
| [Regeln bearbeiten und anwenden](./user-guide/edit-and-apply-rules.md) | Tabellenbearbeitung, Import, Apply-Vorschau |
| [Vorgangsverlauf](./user-guide/operations-history.md) | Fortschrittsbanner und Verlaufsseite |
| [Portscan](./user-guide/port-scan.md) | Externe Scan-Ergebnisse und Abdeckung |

## Administration

| Dokument | Beschreibung |
|----------|--------------|
| [Sicherheitsmodell](./administration/security-model.md) | Verschlüsselung, Auth, Netzwerk-Exposure |
| [Umgebungsvariablen](./administration/environment-variables.md) | Vollständige Referenz der Laufzeitkonfiguration |
| [Audit-Log und Export](./administration/audit-log-and-export.md) | Audit-Ereignisse und Step-up-Export |

## Bereitstellung

| Dokument | Beschreibung |
|----------|--------------|
| [Übersicht](./deployment/overview.md) | Bereitstellungsmethode wählen |
| [GHCR + Compose](./deployment/ghcr-compose.md) | Vorgefertigte Images ziehen (empfohlen) |
| [Portainer](./deployment/portainer.md) | Bereitstellung über Portainer-Stack |
| [Nginx Proxy Manager](./deployment/nginx-proxy-manager.md) | Checkliste für HTTPS-Reverse-Proxy |
| [Externer Portscan](./deployment/port-scan.md) | Portscan aktivieren, Netzwerk, Timeouts |

## Betrieb

| Dokument | Beschreibung |
|----------|--------------|
| [Backup und Wiederherstellung](./operations/backup-restore.md) | Postgres- und `.env`-Backups |
| [Upgrade und Rollback](./operations/upgrade-rollback.md) | Versions-Upgrades und Wiederherstellung |
| [Smoke-Tests](./operations/smoke-tests.md) | Verifikation nach der Bereitstellung |

## Referenz

| Dokument | Beschreibung |
|----------|--------------|
| [FAQ](./faq.md) | Häufige Fragen |
| [Fehlerbehebung](./troubleshooting.md) | Symptom → Ursache → Lösung |
| [Über Finenumbers](./about.md) | Autor und Kontakt |

---

Entwickelt von **[Finenumbers](https://finenumbers.com)** — Business-Telefonanbieter für Unternehmen · [apps@finenumbers.com](mailto:apps@finenumbers.com)

Weitere Sprachen: [Dokumentations-Hub](../README.md)
