# Regeln bearbeiten und anwenden

Wenn UFW auf einem Server **installiert und aktiv** ist, öffnen Sie den Tab **Regeln**, um Firewall-Regeln zu verwalten.

## Regeltabelle

Funktionen:

- Suche und Spaltenfilter
- Gruppenabschnitte mit Ein-/Ausklappen
- Drag-and-Drop-Neuordnung (Reihenfolge ist für UFW wichtig)
- Zeilenfarben nach [Synchronisationsstatus](../concepts/ufw-rules-and-states.md)
- Zeile hinzufügen, inline bearbeiten, Zeile löschen

## Vom Server aktualisieren

Klicken Sie **Aktualisieren** (oder Dashboard-Aktualisierung), um:

1. UFW-Status zu erkennen
2. Snapshot vom Server zu laden
3. Entwurfs-Ursprungszustände zu synchronisieren

Verwenden Sie dies nach manuellen Änderungen auf der Server-CLI oder nach teilweisem Anwenden.

## Erzwungene Synchronisation

Warnt die UI vor Drift oder teilweisem Anwenden, nutzen Sie **Erzwungene Synchronisation vom Server**, um die lokale Entwurfsausrichtung durch den tatsächlichen Remote-Snapshot zu ersetzen, bevor Sie weiter bearbeiten.

## Regeln importieren

Symbolleiste → CSV, XLSX oder JSON importieren. Importierte Zeilen in der Tabelle validieren, bevor Sie die Anwenden-Vorschau ausführen.

## Anwenden-Workflow

1. Entwurfsänderungen vornehmen
2. **Anwenden-Vorschau** — geplante Befehle und Diff-Zusammenfassung prüfen
3. **Bestätigen** — Ausführung per SSH (abgelehnt, wenn sich Remote-UFW seit der Vorschau geändert hat — Vorschau erneut ausführen)
4. Fortschritt im Vorgangsbanner beobachten

Details siehe [Entwurf- und Anwenden-Workflow](../concepts/draft-apply-workflow.md).

## Sicherheitstipps

- Behalten Sie mindestens eine Regel, die SSH von Ihrem Admin-Netzwerk erlaubt, bevor Sie Deny-Regeln anwenden
- Führen Sie die Vorschau in der Produktion während eines Wartungsfensters aus
- Prüfen Sie nach dem Anwenden den **Vorgangsverlauf** auf SUCCESS- oder FAILED-Status

## Verwandte Dokumentation

- [UFW-Regeln und Zustände](../concepts/ufw-rules-and-states.md)
- [Vorgangsverlauf](./operations-history.md)
