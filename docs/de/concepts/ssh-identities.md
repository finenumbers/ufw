# SSH-Identitäten

Eine **SSH-Identität** speichert wiederverwendbare Verbindungszugangsdaten: Benutzername, Authentifizierungsmethode und verschlüsselte Secrets. Jeder **Server** verweist auf eine Identität.

## Authentifizierungsmethoden

| Methode | Gespeichertes Secret | Typische Nutzung |
|---------|----------------------|------------------|
| **Passwort** | SSH-Passwort | Einfaches Lab oder Legacy-Hosts |
| **Privater Schlüssel** | PEM-Privatschlüssel | Produktionsschlüssel ohne Passphrase |
| **Privater Schlüssel + Passphrase** | Schlüssel und Passphrase | Verschlüsselte private Schlüssel |

Secrets werden at rest mit **AES-256-GCM** unter Verwendung von `APP_ENCRYPTION_KEY` verschlüsselt. Sie werden nur im Speicher entschlüsselt, wenn eine SSH-Verbindung geöffnet wird.

## Erstellen und Bearbeiten

1. Seitenleiste → **SSH-Identitäten**
2. **Identität hinzufügen** oder vorhandene Zeile öffnen → **Bearbeiten**
3. Pflichtfelder: Anzeigename, SSH-Benutzername, Auth-Methode, Secret(s)

Beim **Bearbeiten** bleiben vorhandene Secrets unverändert, wenn Passwort-/Schlüsselfelder leer gelassen werden.

Die Validierung lehnt leere Namen und ungültige Auth-Kombinationen vor dem Speichern ab.

## Verknüpfung mit Servern

Beim Erstellen oder Bearbeiten eines Servers eine Identität aus der Dropdown-Liste wählen. Eine Änderung der Server-Identität löst beim Speichern eine SSH-Verifizierung aus, wenn sich Verbindungsparameter geändert haben.

## Identität löschen

Das Löschen ist blockiert, solange noch ein Server auf die Identität verweist. Die UI listet verknüpfte Server. Diese Server zuerst neu zuweisen oder löschen.

## Sicherheitshinweise

- Identitäts-Secrets erscheinen im **Konfigurationsexport** (JSON v2) nach Passwortbestätigung — Exporte wie hochsensible Daten behandeln
- Rotieren von `APP_ENCRYPTION_KEY` ohne erneute Eingabe der Secrets macht vorhandenen Ciphertext unlesbar — Key-Rotation sorgfältig planen
- Eine Identität kann von vielen Servern geteilt werden (gleicher Admin-Benutzer, gleicher Schlüssel)

## Verwandte Dokumentation

- [Server und SSH](./servers-and-ssh.md)
- [Konfiguration importieren und exportieren](./import-export-config.md)
- [Sicherheitsmodell](../administration/security-model.md)
