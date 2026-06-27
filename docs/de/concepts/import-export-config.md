# Konfiguration importieren und exportieren

Sie können eine **vollständige Serverkonfiguration** (alle Server, Identitäten, Regel-Metadaten) als JSON **v2** exportieren und importieren.

## Export

1. Von der **Server**-Seite **Konfiguration speichern** verwenden
2. Ihr **Kontopasswort** erneut eingeben (Step-up-Authentifizierung)
3. JSON-Datei herunterladen

### Wichtiger Sicherheitshinweis

Die Exportdatei enthält **SSH-Passwörter und private Schlüssel im Klartext**. Behandeln Sie sie wie ein Geheimnis:

- Verschlüsselt speichern (Passwortmanager-Tresor, verschlüsselte Festplatte)
- Niemals in Git committen oder über unsichere Kanäle senden
- Bei erfolgreichem Export wird ein `CONFIG_EXPORT`-Audit-Ereignis geschrieben

## Import

1. **Konfiguration laden** auf der Server-Seite verwenden
2. JSON-v2-Datei auswählen
3. Zusammenfassung prüfen: zu erstellende, aktualisierende, löschende Server
4. Ihr **Kontopasswort** im Bestätigungsdialog erneut eingeben
5. Bestätigen — Import läuft in einer Transaktion (Upsert zuerst, Löschen zuletzt)

Import nutzt dieselben Rate-Limits wie Export (10 Versuche pro Minute pro Benutzer).

### Destruktives Verhalten

Server, die in der Importdatei **fehlen**, können **gelöscht** werden, zusammen mit allen Regeln und Snapshots. Lesen Sie den Bestätigungsdialog sorgfältig.

Importierte SSH-Host-Keys werden als **Nicht verifiziert** markiert — führen Sie auf jedem Server-Dashboard **Status aktualisieren** aus, bevor Sie Regeln anwenden.

### Import-Limits

- Regel-Imports (CSV, XLSX, JSON) sind auf **10 000 Zeilen** pro Datei begrenzt.
- Konfigurationsimport-**Vorschau** ist auf **10 Versuche pro Minute** pro Benutzer begrenzt — warten Sie und versuchen Sie es erneut, wenn Sie das Limit erreichen.

## Export vs. Postgres-Backup

| Methode | Enthält | Am besten für |
|---------|---------|---------------|
| **Konfigurationsexport (JSON)** | Lesbare Konfiguration + Geheimnisse im Klartext | Migration zwischen Instanzen, Notfallkopie |
| **Postgres-Dump** | Vollständige Datenbank inkl. verschlüsselter Geheimnisse | Vollständige Wiederherstellung mit gleichem `APP_ENCRYPTION_KEY` |
| **`.env`-Backup** | Laufzeitgeheimnisse | Erforderlich zum Entschlüsseln der DB-Zugangsdaten nach Wiederherstellung |

Für vollständige Disaster Recovery sichern Sie **sowohl** Postgres **als auch** `.env` — siehe [Backup und Wiederherstellung](../operations/backup-restore.md).

## Verwandte Dokumentation

- [Audit-Protokoll und Export](../administration/audit-log-and-export.md)
- [SSH-Identitäten](./ssh-identities.md)
