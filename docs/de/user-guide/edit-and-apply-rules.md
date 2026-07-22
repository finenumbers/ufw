# Regeln bearbeiten und anwenden

Wenn UFW **installiert und aktiv** ist, ist die **Regeltabelle** auf dem Server-Dashboard die Hauptbearbeitungsoberfläche.

## Funktionen der Regeltabelle

| Funktion | Beschreibung |
|----------|--------------|
| **Suche** | Sichtbare Zeilen filtern |
| **Spaltenfilter** | Nach Gruppe oder Name filtern |
| **Gruppenabschnitte** | Gruppierte Zeilen ein-/ausklappen |
| **Drag-and-Drop** | Regeln neu ordnen (Reihenfolge beeinflusst UFW) |
| **Zeilenfarben** | [Origin-State](../concepts/ufw-rules-and-states.md)-Indikatoren |
| **Inline-Bearbeitung** | Doppelklick oder Bearbeiten-Aktion auf Zeile |
| **Hinzufügen / Löschen** | Toolbar- und Zeilenaktionen |
| **Mehr laden** | Unendliches Scrollen für große Regelsätze |

## Vom Server aktualisieren

**Status aktualisieren** auf dem Dashboard (oder Sync aus Toolbar):

1. UFW-Zustand über SSH erkennen
2. Neuen Snapshot speichern
3. Tabelle aus Remote + lokalen Metadaten neu seeden

Verwenden nach manuellen CLI-Änderungen auf dem Server oder nach teilweisem Anwenden.

Ungespeicherte Entwurfsänderungen lösen vor dem Neuladen einen Bestätigungsdialog aus.

## Erzwungene Synchronisation vom Server

Wenn die UI vor Drift oder teilweisem Anwenden warnt, **Erzwungene Synchronisation vom Server** verwenden, um den Entwurf am tatsächlichen Remote-Snapshot auszurichten, bevor weitere Bearbeitungen.

Verfügbar im Apply-Vorschau-Dialog und zugehörigen Warnungen — kein Ersatz für erneute Vorschau, wenn sich Remote zwischen Vorschau und Bestätigung geändert hat.

## Regeln importieren

Toolbar → **Importieren** **CSV**, **XLSX** oder **JSON**:

- Zeilen werden in Entwurf gemerged; Duplikate per Fingerabdruck übersprungen oder gemerged gemäß Importregeln
- Zeilen in der Tabelle vor Apply-Vorschau validieren
- Import betrifft nur Entwurf bis zum Anwenden

## Regeln exportieren

Aktuelle Tabelle nach **XLSX** für Offline-Review oder Backup exportieren. XLSX-Layout entspricht Import-Spaltenreihenfolge für Round-Trip-Workflows.

## Apply-Workflow

1. Entwurf bearbeiten
2. **Regeln speichern** — geplante Befehle und Zusammenfassungszähler prüfen
3. **Bestätigen** — führt über SSH aus (abgelehnt, wenn Remote seit Vorschau geändert)
4. **Vorgangsbanner** für Befehls-für-Befehl-Fortschritt beobachten

**Regeln speichern** / Anwenden ist deaktiviert, bis SSH-Host-Key **verifiziert** ist — für importierte Server zuerst **Status aktualisieren**.

Siehe [Entwurf-und-Anwenden-Workflow](../concepts/draft-apply-workflow.md).

## Sicherheitstipps

- Mindestens eine Regel behalten, die SSH von Ihrem Admin-Netz erlaubt, vor Deny-Regeln
- Vorschau in Produktion während eines Wartungsfensters ausführen
- **Vorgangsverlauf** nach Apply auf ERFOLG oder FEHLER prüfen

## Verwandte Dokumentation

- [UFW-Regeln und Zustände](../concepts/ufw-rules-and-states.md)
- [Vorgangsverlauf](./operations-history.md)
