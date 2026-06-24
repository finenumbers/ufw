# UFW-Regeln und Zustände

Regeln werden in ein einheitliches Zeilenmodell mit **Kern**-Feldern (was UFW interessiert) und **UI**-Feldern (Name, Gruppe, Farb-Metadaten) normalisiert.

## Regel-Kernfelder

Typische Spalten umfassen Aktion (allow/deny/reject), Richtung, Protokoll, Ports, Quell-/Zieladressen und Protokollierungsmodus. Die exakte Menge entspricht der ausdrucksstarken UFW-Regelsyntax — siehe die Regeltabelle in der Oberfläche.

## Sync-Zustände (Zeilenfarben)

Jede Zeile hat einen **Zustand**, der zeigt, wie lokale Entwurfsdaten zum letzten Server-Snapshot stehen:

| Zustand | Bedeutung |
|---------|-----------|
| **MATCHED** | Entwurf stimmt mit dem überein, was UFW auf dem Server gemeldet hat |
| **REMOTE_ONLY** | Existiert im Server-Snapshot, aber nicht in Ihrem lokalen Entwurf |
| **LOCAL_ONLY** | In Ihrem Entwurf, aber nicht auf dem Server (wird beim Anwenden hinzugefügt) |
| **DRAFT_ONLY** | Lokale Bearbeitung noch nicht angewendet; weicht von der MATCHED-Basis ab |

Farben helfen, Drift vor dem Anwenden zu erkennen. Nach **Erzwungene Synchronisation vom Server** richtet sich der lokale Entwurf am Remote-Zustand aus.

## Fingerabdrücke

Jede Regel hat einen aus Kernfeldern abgeleiteten Fingerabdruck. Wird verwendet, um Zeilen über Snapshots hinweg abzugleichen und Neuordnungs-/Löschvorgänge bei der Anwenden-Planung zu erkennen.

## Gruppierung und Reihenfolge

- **Gruppen** — Regeln visuell organisieren; Gruppenname ist UI-Metadaten
- **Reihenfolge** — UFW-Regelreihenfolge ist relevant; Neuordnung kann beim Anwenden Löschen-und-Neuanlegen auf dem Server erfordern

## Importformate

Regeln können über die Regel-Symbolleiste aus **CSV**, **XLSX** oder **JSON** importiert werden. Importierte Zeilen werden Entwurfseinträge — erreichen den Server erst nach dem Anwenden.

## Verwandte Dokumentation

- [Entwurf-und-Anwenden-Workflow](./draft-apply-workflow.md)
- [Regeln bearbeiten und anwenden](../user-guide/edit-and-apply-rules.md)
