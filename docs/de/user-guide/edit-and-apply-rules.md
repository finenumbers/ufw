# Regeln bearbeiten und anwenden

Wenn UFW auf einem Server **installiert und aktiv** ist, können Sie Firewall-Regeln über die **Regeltabelle** im Server-Dashboard verwalten.

## Regeltabelle

Funktionen:

- Suche und Spaltenfilter
- Gruppenabschnitte mit Ein-/Ausklappen
- Drag-and-Drop-Neuordnung (Reihenfolge ist für UFW relevant)
- Zeilenfarben nach [Sync-Zustand](../concepts/ufw-rules-and-states.md)
- Zeile hinzufügen, inline bearbeiten, Zeile löschen

## Vom Server aktualisieren

Nutzen Sie **Status aktualisieren** im Dashboard (oder die Aktualisierung in der Regel-Toolbar), um:

1. Den UFW-Zustand per SSH zu erkennen
2. Einen neuen Snapshot vom Server zu laden
3. Die Regeltabelle aus Remote-Daten und lokalen Metadaten neu zu befüllen

Bei **ungespeicherten Änderungen** zeigt die App vor dem Neuladen vom Server einen Bestätigungsdialog.

Nutzen Sie dies nach manuellen Änderungen in der Server-CLI oder nach einem teilweisen Anwenden.

## Erzwungene Synchronisation

Warnt die UI vor Drift oder teilweisem Anwenden, nutzen Sie **Erzwungene Synchronisation vom Server**, um die lokale Entwurfsausrichtung durch den tatsächlichen Remote-Snapshot zu ersetzen, bevor Sie weiter bearbeiten.

## Regeln importieren

Toolbar → CSV, XLSX oder JSON importieren. Importierte Zeilen in der Tabelle prüfen, bevor Sie die Anwenden-Vorschau starten.

## Anwenden-Workflow

1. Entwurfsänderungen vornehmen
2. **Anwenden-Vorschau** — geplante Befehle und Diff-Zusammenfassung prüfen
3. **Bestätigen** — Ausführung per SSH (wird abgelehnt, wenn sich Remote-UFW seit der Vorschau geändert hat — Vorschau erneut ausführen)
4. Fortschritt im Vorgangsbanner verfolgen

**Regeln speichern** (Anwenden-Vorschau) ist deaktiviert, bis der SSH-Host-Key **verifiziert** ist — führen Sie zuerst **Status aktualisieren** aus, wenn der Server aus der Konfiguration importiert wurde.

Details siehe [Entwurf- und Anwenden-Workflow](../concepts/draft-apply-workflow.md).

## Sicherheitstipps

- Behalten Sie mindestens eine Regel, die SSH aus Ihrem Admin-Netz erlaubt, bevor Sie Deny-Regeln anwenden
- Führen Sie die Vorschau in Produktion während eines Wartungsfensters aus
- Prüfen Sie nach dem Anwenden den **Vorgangsverlauf** auf SUCCESS- oder FAILED-Status

## Verwandte Dokumentation

- [UFW-Regeln und Zustände](../concepts/ufw-rules-and-states.md)
- [Vorgangsverlauf](./operations-history.md)
