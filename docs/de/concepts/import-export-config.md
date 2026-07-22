# Konfiguration importieren und exportieren

Exportieren und importieren Sie eine **JSON-v2**-Datei mit allen Servern, SSH-Identitäten (einschließlich entschlüsselter Secrets) und zugehörigen Metadaten. Für Backup, Migration oder Disaster Recovery — nicht für tägliche Regelbearbeitung.

Regel-Level-Import/Export (CSV, XLSX) ist separat — siehe [Regeln bearbeiten und anwenden](../user-guide/edit-and-apply-rules.md).

## Export-Ablauf

1. **Server**-Liste → **Konfiguration speichern**
2. Ihr Konto-**Passwort** eingeben (Step-up-Authentifizierung)
3. JSON-Datei herunterladen (`servers-config-YYYY-MM-DD.json`)

Der Export enthält entschlüsselte SSH-Secrets. Datei verschlüsselt at rest aufbewahren; löschen, wenn nicht mehr benötigt.

Ein kurzlebiges Token schützt die Download-API nach Passwortbestätigung.

Ratenlimit: 5 Exporte pro Minute pro Benutzer.

## Import-Ablauf

1. **Konfiguration laden** → JSON-Datei auswählen
2. **Vorschau** zeigt Diff: zu erstellende, aktualisierende oder löschende Server und Identitäten
3. Mit Passwort bestätigen → Import wendet Änderungen an

Import wartet, bis Pro-Server-Warteschlangen idle sind, und blockiert, wenn destruktive Operationen mit aktiver Arbeit kollidieren würden.

## JSON-v2-Format

| Abschnitt | Inhalt |
|-----------|--------|
| **version** | `2` |
| **identities** | Name, Benutzername, Auth-Methode, Secrets |
| **servers** | Name, Host, Port, Identitätsreferenz, Host-Key-Felder |

Legacy nur-Array- oder v1-Dateien werden abgelehnt.

Doppelte Keys (gleicher Host + Port + Identität) werden beim Parsen abgelehnt.

## Löschsemantik beim Import

Server in der Datenbank, die in der importierten Datei fehlen, erscheinen in der Vorschau im **Löschen**-Set. Nur bestätigen, wenn Sie diese Serverdatensätze und alle zugehörigen Regeln, Entwürfe und Snapshots lokal entfernen wollen.

Remote-UFW auf gelöschten Serverdatensätzen wird **nicht** geändert.

## Verwandte Dokumentation

- [SSH-Identitäten](./ssh-identities.md)
- [Backup und Wiederherstellung](../operations/backup-restore.md)
- [Audit-Log und Export](../administration/audit-log-and-export.md)
