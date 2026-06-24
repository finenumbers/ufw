# UFW Remote Manager — Dokumentation (Deutsch)

Vollständiger Leitfaden für Administratoren und Betreiber.

## Erste Schritte

| Dokument | Beschreibung |
|----------|--------------|
| [Einführung](./introduction.md) | Was das Produkt ist und für wen es gedacht ist |
| [Schnellstart](./quick-start.md) | Lokales Docker-Setup in wenigen Minuten |
| [Architektur](./architecture.md) | Komponenten, Datenfluss, Sicherheitsgrenzen |

## Konzepte

| Dokument | Beschreibung |
|----------|--------------|
| [SSH-Identitäten](./concepts/ssh-identities.md) | Wiederverwendbare verschlüsselte Zugangsdaten |
| [Server und SSH](./concepts/servers-and-ssh.md) | Host-Validierung, Host-Keys, Verbindungstests |
| [UFW-Regeln und Zustände](./concepts/ufw-rules-and-states.md) | Regelmodell und farbcodierte Sync-Zustände |
| [Entwurf-und-Anwenden-Workflow](./concepts/draft-apply-workflow.md) | Lokal bearbeiten, Vorschau, bestätigen, über SSH anwenden |
| [Konfiguration importieren und exportieren](./concepts/import-export-config.md) | Vollständiges Serverkonfigurations-Backup (JSON v2) |

## Benutzerhandbuch

| Dokument | Beschreibung |
|----------|--------------|
| [Ersteinrichtung](./user-guide/initial-setup.md) | Erstes Administratorkonto und Anmeldung |
| [Server verwalten](./user-guide/manage-servers.md) | Server hinzufügen, bearbeiten, löschen; UFW installieren/aktivieren |
| [Regeln bearbeiten und anwenden](./user-guide/edit-and-apply-rules.md) | Tabellenbearbeitung, Import, Anwenden-Vorschau |
| [Vorgangsverlauf](./user-guide/operations-history.md) | Fortschrittsbanner und Verlaufsseite |

## Administration

| Dokument | Beschreibung |
|----------|--------------|
| [Sicherheitsmodell](./administration/security-model.md) | Verschlüsselung, Authentifizierung, Netzwerkexposition |
| [Umgebungsvariablen](./administration/environment-variables.md) | Gesamte Laufzeitkonfiguration |
| [Audit-Protokoll und Export](./administration/audit-log-and-export.md) | Audit-Ereignisse und Step-up-Export |

## Bereitstellung

| Dokument | Beschreibung |
|----------|--------------|
| [Übersicht](./deployment/overview.md) | Bereitstellungsmethode wählen |
| [GHCR + Compose](./deployment/ghcr-compose.md) | Vorgefertigte Images abrufen (empfohlen) |
| [Portainer](./deployment/portainer.md) | Bereitstellung über Portainer-Stack |
| [Nginx Proxy Manager](./deployment/nginx-proxy-manager.md) | HTTPS-Reverse-Proxy-Checkliste |

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
| [Über Finenumbers](./about.md) | Produktautor und Kontakt |

---

Entwickelt von **[Finenumbers](https://finenumbers.com)** — business phone operator for business · [apps@finenumbers.com](mailto:apps@finenumbers.com)

Weitere Sprachen: [Dokumentations-Hub](../README.md)
