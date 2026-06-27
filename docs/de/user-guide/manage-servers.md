# Server verwalten

Dieser Leitfaden führt durch den Server-Lebenszyklus: hinzufügen, UFW konfigurieren, aktualisieren, bearbeiten und löschen.

## Voraussetzungen

Legen Sie mindestens eine [SSH-Identität](../concepts/ssh-identities.md) an, bevor Sie einen Server hinzufügen.

## Server hinzufügen

1. Seitenleiste → **Server** oder **Server hinzufügen** klicken
2. Name, Host, Port ausfüllen und Identität auswählen
3. **Server erstellen** klicken — die SSH-Verbindung wird beim Absenden automatisch verifiziert
4. Bei Erfolg landen Sie auf dem Server-Dashboard

Schlägt die Verifizierung fehl, prüfen Sie Host-Erreichbarkeit, Zugangsdaten, Firewall (SSH vom Docker-Host erlaubt) und [Host-Validierung](../concepts/servers-and-ssh.md).

## Server-Dashboard

Das Dashboard lädt den **gecachten UFW-Status** aus dem neuesten Postgres-Snapshot — kein SSH beim ersten Rendern. Port-Scan- und Docker-Panels laden ebenfalls die neuesten gecachten Ergebnisse aus Postgres, sofern verfügbar.

| Status | Verfügbare Aktionen |
|--------|---------------------|
| UFW nicht installiert | **Status aktualisieren**, dann **UFW installieren** (nach Aktualisierung, die bestätigt, dass UFW fehlt) |
| Installiert, aber inaktiv | Nur **Status aktualisieren** — UFW ist bereits installiert; Aktualisierung nutzen, um den Aktiv/Inaktiv-Zustand zu erkennen |
| Installiert und aktiv | **Regel hinzufügen**, **Regeln speichern**, **Status aktualisieren** |

Klicken Sie zuerst auf **Status aktualisieren**, um SSH zu prüfen und festzustellen, ob UFW installiert ist. **UFW installieren** bleibt deaktiviert, bis eine erfolgreiche Aktualisierung fehlendes UFW anzeigt.

Bis Sie **Status aktualisieren** ausführen, kann das UFW-Abzeichen ein **gecachtes** Aktiv/Inaktiv-Label aus dem letzten Snapshot anzeigen.

Nutzen Sie **Status aktualisieren**, um den neuesten UFW-Zustand per SSH abzurufen und die Regeltabelle zu synchronisieren. Bei **ungespeicherten Regeländerungen** fragt die App vor dem Neuladen vom Server zur Bestätigung.

Hat die App **noch keinen UFW-Snapshot** in Postgres (neuer Server, nie aktualisiert usw.), läuft einmalig automatisch eine Hintergrund-Synchronisation, um den Cache zu füllen.

## Regelzähler

In der UI erscheinen zwei verschiedene Zähler:

| Ort | Bezeichnung | Bedeutung |
|-----|-------------|-----------|
| Karte in der **Serverliste** | gespeicherte Regeln | Anzahl der in lokalen Metadaten gespeicherten Regeln (`ruleRecord`) |
| Abzeichen im **Dashboard** unter Regel hinzufügen | in Tabelle | Anzahl der Zeilen in der Regeltabelle (aktive Entwurfssitzung) |

Diese Zahlen können sich beim Bearbeiten, Synchronisieren oder Importieren unterscheiden. Das Dashboard-Abzeichen entspricht der Gesamtzahl in der Regeltabelle.

## Server bearbeiten

1. Server öffnen → **Bearbeiten**
2. Name, Host, Port oder Identität ändern
3. Die SSH-Verbindung wird beim Absenden automatisch verifiziert, wenn Verbindungsparameter geändert wurden

Die Bearbeitungsseite zeigt den gespeicherten Host-Key-Fingerabdruck und bei Bedarf eine Warnung **Nicht verifiziert** — es gibt keine separate Test-Schaltfläche.

## Server löschen

**Gefahrenbereich** auf der Bearbeitungsseite oder in den Servereinstellungen:

- Löscht alle lokalen Regeln, Entwürfe, Snapshots für diesen Server
- **Ändert nicht** Remote-UFW

Nur bestätigen, wenn Sie Verwaltungsdaten entfernen wollen, nicht um Remote-Firewall-Regeln zu löschen.

## Werkzeuge auf der Serverliste

Von der Hauptserverseite aus können Sie:

- **Konfiguration speichern** / **Konfiguration laden** — vollständiger JSON-Export/Import (siehe [Konfiguration importieren und exportieren](../concepts/import-export-config.md))

## Verwandte Dokumentation

- [Server und SSH](../concepts/servers-and-ssh.md)
- [Regeln bearbeiten und anwenden](./edit-and-apply-rules.md)
