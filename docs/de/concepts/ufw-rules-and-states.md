# UFW-Regeln und Zustände

Die Regeltabelle zeigt eine **vereinheitlichte Ansicht**: Remote-UFW-Regeln, lokale Metadaten und Ihre Entwurfsänderungen. Zeilen**farben** zeigen, wie jede Zeile zum Server und zur Datenbank steht.

## Regelstruktur

Jede Zeile hat:

| Ebene | Felder |
|-------|--------|
| **Kern** | Aktion, Richtung, Protokoll, Adressen, Ports, Interface, App-Profil, Log-Modus, Kommentar, IPv6 |
| **UI-Metadaten** | Gruppe, Name, Notizen (lokal gespeichert, nicht an UFW gesendet, außer im Kommentar) |
| **Origin** | Sync-Zustand, der die Zeilenfarbe steuert |

Fingerabdrücke identifizieren Regeln über Remote-Reloads und lokale Bearbeitungen hinweg.

## Origin-Zustände

| Zustand | Farbbedeutung | Typische Situation |
|---------|---------------|-------------------|
| **MATCHED** | Remote und lokale Metadaten stimmen überein | Stabile synchronisierte Regel |
| **REMOTE_ONLY** | Auf Server, nicht in lokalen Metadaten | Neue Remote-Regel nach Refresh |
| **LOCAL_ONLY** | In lokaler DB, nicht auf Server | Ausstehendes Hinzufügen oder remote entfernt |
| **DRAFT_ONLY** | Entwurfsänderung noch nicht angewendet | Neue Zeile oder geänderte Kernfelder |
| **CONFLICT** | Gleicher Fingerabdruck, unterschiedliche Kernfelder | Drift — vor Anwenden prüfen |
| **DELETED** | Im Entwurf als gelöscht markiert | Wird bei Anwenden entfernt |

Farben helfen, Drift **vor** dem Anwenden zu erkennen. Nach **Erzwungene Synchronisation vom Server** richtet sich der Entwurf am Remote-Snapshot aus.

## Hervorhebung überlappender Adressen

Verschiedene Regeln können denselben Traffic treffen, auch wenn sich die Fingerabdrücke unterscheiden — z. B. `95.163.183.223` innerhalb von `95.163.183.192/26` oder ein breiteres `/24` über einem bestehenden `/26`.

Zeilen, die in mindestens ein solches Paar fallen, werden in der Regeltabelle **violett** hervorgehoben. Diese Farbe hat Vorrang vor den grün/gelb/rot Origin-Farben. **Beide** Zeilen eines Paares werden markiert.

Die Legende über der Tabelle enthält ein violettes Feld: **Überlappende IP- oder CIDR-Bereiche**.

Die Überlappung wird aus dem aktuellen Entwurf berechnet (gleiche Richtung, gleiche IP-Familie, Adressen nicht `anywhere`). Es ist **nur eine Warnung** — Import und Anwenden werden nicht blockiert. Entfernen oder passen Sie Adressen an, bis die violette Markierung verschwindet.

Typisch nach Import: ein neuer Host oder CIDR überlappt eine bestehende Regel auf dem Server. Reihenfolge prüfen — UFW nutzt die erste passende Regel.

## Zwei Regelzähler

Die UI zeigt an verschiedenen Stellen unterschiedliche Zähler:

| Ort | Label | Zählt |
|-----|-------|-------|
| **Serverliste**-Karte | gespeicherte Regeln | Zeilen in `ruleRecord` (lokale Metadaten) |
| **Dashboard**-Badge | in Tabelle | Zeilen in der aktiven Entwurfssitzungstabelle |

Diese unterscheiden sich während Sie bearbeiten, importieren oder synchronisieren. Das Dashboard-Badge entspricht der sichtbaren Tabellenlänge.

## Reihenfolge ist wichtig

UFW wertet Regeln in Reihenfolge aus. Die Tabelle unterstützt Drag-and-Drop-Neuordnung. Apply kann Reihenfolge-Sync-Operationen ausgeben, wenn Remote-Nummerierung von Ihrer Entwurfsreihenfolge abweicht.

## Remote vs. lokale Metadaten

- **Remote-Kernfelder** stammen aus geparstem `ufw status numbered`-Output
- **Gruppe, Name, Notizen** existieren nur in UFW Remote Manager, sofern nicht in UFW-Regelkommentare kopiert
- Apply schreibt Kernfelder auf den Server; UI-Metadaten bleiben in Postgres

## Verwandte Dokumentation

- [Entwurf-und-Anwenden-Workflow](./draft-apply-workflow.md)
- [Regeln bearbeiten und anwenden](../user-guide/edit-and-apply-rules.md)
