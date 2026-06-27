# Server verwalten

Dieser Leitfaden führt durch den Server-Lebenszyklus: hinzufügen, UFW konfigurieren, aktualisieren, bearbeiten und löschen.

## Voraussetzungen

Legen Sie mindestens eine [SSH-Identität](../concepts/ssh-identities.md) an, bevor Sie einen Server hinzufügen.

## Server hinzufügen

1. Seitenleiste → **Server** oder **Server hinzufügen** klicken
2. Name, Host, Port ausfüllen und Identität auswählen
3. **Server erstellen** klicken — SSH-Test läuft automatisch
4. Bei Erfolg landen Sie auf dem Server-Dashboard

Schlägt der SSH-Test fehl, prüfen Sie Host-Erreichbarkeit, Zugangsdaten, Firewall (SSH vom Docker-Host erlaubt) und [Host-Validierung](../concepts/servers-and-ssh.md).

## Server-Dashboard

Das Dashboard lädt den **gecachten UFW-Status** aus dem neuesten Postgres-Snapshot — kein SSH beim ersten Rendern. So bleibt die Seite schnell.

| Status | Verfügbare Aktionen |
|--------|---------------------|
| UFW nicht installiert | **Status aktualisieren**, dann **UFW installieren** (falls nötig) |
| Installiert, aber inaktiv | **UFW aktivieren** |
| Installiert und aktiv | **Regeln**, **Status aktualisieren** |

Klicken Sie zuerst auf **Status aktualisieren**, um SSH zu prüfen und festzustellen, ob UFW installiert ist. **UFW installieren** bleibt deaktiviert, bis eine erfolgreiche Aktualisierung fehlendes UFW anzeigt.

**Status aktualisieren** verwenden, um den neuesten UFW-Zustand per SSH abzurufen und die Regeltabelle zu synchronisieren.

Ist UFW aktiv, die App aber **noch ohne Snapshot** (erster Besuch nach der Aktivierung), läuft einmalig automatisch eine Hintergrund-Synchronisation, um den Cache zu füllen.

## Server bearbeiten

1. Server öffnen → **Bearbeiten**
2. Name, Host, Port oder Identität ändern
3. SSH-Test vor dem Speichern erforderlich, wenn Verbindungsparameter geändert wurden

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
