# Server und SSH

Ein **Server**-Datensatz speichert Anzeigename, Host, Port, SSH-Identität und optionalen Host-Key-Fingerabdruck. Alle Remote-UFW-Arbeit läuft über diesen Datensatz.

## Host-Validierung

Vor dem Speichern validiert die App den Ziel-Host:

| Prüfung | Standardverhalten |
|---------|-------------------|
| Private IP-Bereiche | **Abgelehnt** (RFC1918, Loopback, Link-Local) |
| Cloud-Metadaten-IPs | **Abgelehnt** |
| Öffentliche Hostnamen / IPs | Erlaubt |
| Benutzerdefinierte Allowlist | `SSH_ALLOWED_CIDRS` setzen, um bestimmte private Bereiche zu erlauben (Lab/VPN) |

DNS-Auflösung wird wo anwendbar validiert, damit Tippfehler früh scheitern.

## Verbindungsverifizierung

**Server erstellen** und **Server bearbeiten** (wenn Host, Port oder Identität sich ändern) führen automatisch einen SSH-Verbindungstest aus. Es gibt keinen separaten *Verbindung testen*-Button im Bearbeitungsformular.

Fehlermeldungen verweisen auf Erreichbarkeit, Zugangsdaten, Firewall oder Host-Validierung — siehe [Fehlerbehebung](../troubleshooting.md).

## SSH-Host-Keys (Trust on First Use)

Bei der ersten erfolgreichen Verbindung wird der Server-Host-Key-Fingerabdruck gespeichert und als **verifiziert** markiert.

| Zustand | UI | Regeln anwenden |
|---------|-----|-----------------|
| **Verifiziert** | Fingerabdruck auf Bearbeitungsseite angezeigt | Nach Refresh erlaubt |
| **Nicht verifiziert** | Warnung auf Dashboard und Bearbeitungsseite | **Regeln speichern** (Anwenden) blockiert bis **Status aktualisieren** erfolgreich |

Dies reduziert MITM-Risiko beim ersten Connect. Um einem neuen Key nach Server-Neuaufbau zu vertrauen, Server aktualisieren oder per Refresh löschen und neu verifizieren.

Importierte Server aus der Konfiguration können mit gespeicherten Fingerabdrücken ankommen — vor dem Anwenden von Regeln mit **Status aktualisieren** verifizieren.

## Sudo und UFW

Remote-Befehle setzen voraus, dass der SSH-Benutzer `ufw` ausführen kann — typischerweise über passwortloses sudo für `ufw` oder root. Die App umschließt apt-install-Befehle bei Bedarf mit `sudo` für **UFW installieren**.

Stellen Sie sicher, dass `/etc/sudoers` die erforderlichen Befehle für Ihren gewählten Benutzer erlaubt.

## Doppelte Server

Die gleiche Host- + Port- + Identitäts-Kombination kann nicht zweimal registriert werden. Verwenden Sie unterschiedliche Namen, wenn Sie denselben Host absichtlich über verschiedene Konten verwalten (verschiedene Identitäten).

## Verwandte Dokumentation

- [SSH-Identitäten](./ssh-identities.md)
- [Server verwalten](../user-guide/manage-servers.md)
- [Umgebungsvariablen](../administration/environment-variables.md) — `SSH_ALLOWED_CIDRS`
