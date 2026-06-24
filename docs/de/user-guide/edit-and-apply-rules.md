# Regeln bearbeiten und anwenden

Wenn UFW auf einem Server **installiert und aktiv** ist, öffnen Sie den Tab **Regeln**, um Firewall-Regeln zu verwalten.

## Regeltabelle

Funktionen:

- Suche und Spaltenfilter
- Gruppenabschnitte mit Ein-/Ausklappen
- Drag-and-Drop-Neuordnung (Reihenfolge ist für UFW relevant)
- Zeilenfarben nach [Sync-Zustand](../concepts/ufw-rules-and-states.md)
- Zeile hinzufügen, inline bearbeiten, Zeile löschen

## Vom Server aktualisieren

**Status aktualisieren** klicken (oder Dashboard-Aktualisierung verwenden), um:

1. UFW-Zustand zu erkennen
2. Snapshot vom Server zu laden
3. Entwurfs-Ursprungszustände zu synchronisieren

Verwenden Sie dies nach manuellen Änderungen auf der Server-CLI oder nach teilweisem Anwenden.

## Erzwungene Synchronisation

Warnt die Oberfläche vor Drift oder teilweisem Anwenden, verwenden Sie **Erzwungene Synchronisation vom Server**, um die lokale Entwurfsausrichtung durch den tatsächlichen Remote-Snapshot zu ersetzen, bevor Sie weiter bearbeiten.

## Regeln importieren

Symbolleiste → CSV, XLSX oder JSON importieren. Importierte Zeilen in der Tabelle validieren, bevor Sie die Anwenden-Vorschau ausführen.

## Anwenden-Workflow

1. Entwurfsänderungen vornehmen
2. **Regeln speichern** — geplanten Befehle und Diff-Zusammenfassung prüfen
3. **Bestätigen** — Ausführung über SSH
4. Vorgangsbanner auf Fortschritt beobachten

Details siehe [Entwurf-und-Anwenden-Workflow](../concepts/draft-apply-workflow.md).

## Sicherheitstipps

- Behalten Sie mindestens eine Regel, die SSH von Ihrem Admin-Netzwerk erlaubt, bevor Sie Deny-Regeln anwenden
- Vorschau in der Produktion während eines Wartungsfensters ausführen
- **Vorgangsverlauf** nach Anwenden auf SUCCESS- oder FAILED-Status prüfen

## Verwandte Dokumentation

- [UFW-Regeln und Zustände](../concepts/ufw-rules-and-states.md)
- [Vorgangsverlauf](./operations-history.md)
