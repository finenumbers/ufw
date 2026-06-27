# Server und SSH

Ein **Server**-Datensatz repräsentiert einen Linux-Host, den Sie verwalten. Die App verbindet sich über SSH, um UFW-Befehle auszuführen und den Firewall-Zustand zu lesen.

## Serverfelder

| Feld | Zweck |
|------|-------|
| **Name** | Anzeigename in der Seitenleiste |
| **Host** | IP-Adresse oder DNS-Name (vor dem Speichern validiert) |
| **Port** | SSH-Port (Standard 22) |
| **SSH-Identität** | Für die Verbindung verwendete Zugangsdaten |

## Host-Validierung (SSRF-Schutz)

Bevor ein Server gespeichert wird, wird der Host validiert:

- Private IP-Bereiche (10.x, 172.16–31, 192.168.x) sind standardmäßig **blockiert**
- Link-Local- und Cloud-Metadaten-Adressen sind blockiert
- IPv4-gemappte IPv6-Private-Adressen sind blockiert
- Optionale Allowlist: `SSH_ALLOWED_CIDRS` in `.env` setzen (z. B. `10.0.0.0/8`) für interne Netzwerke

Dies verhindert, dass die Anwendung als Proxy zum Scannen interner Netzwerke missbraucht wird.

## DNS-Auflösungsprüfung

Die Validierung erfolgt in zwei Stufen:

1. **Beim Speichern** — der Hostname-String wird geprüft (private Literale, Metadaten-Hosts, optionale CIDR-Allowlist).
2. **Vor der Verbindung** — der Hostname wird in eine IP aufgelöst, und die **aufgelöste Adresse** wird mit denselben Regeln geprüft.

Dies schließt DNS-Rebinding-Lücken, bei denen ein öffentlicher Hostname später in eine private oder Metadaten-IP aufgelöst wird.

## SSH-Verifizierung beim Speichern

Beim Anlegen oder Aktualisieren eines Servers (Host-, Port- oder Identitätsänderung) wird beim Absenden automatisch ein **SSH-Verbindungstest** ausgeführt. Es gibt keine separate Test-Schaltfläche — das Speichern ist blockiert, bis die Verifizierung erfolgreich ist.

Bei der ersten erfolgreichen Verifizierung wird der Host-Key-Fingerabdruck gespeichert und der Server als **verifiziert** markiert.

## SSH-Host-Key-Pinning

| Zustand | Bedeutung |
|---------|-----------|
| **Verifiziert** | Key nach erfolgreichem Speichern beim Anlegen/Aktualisieren oder **Status aktualisieren** gespeichert |
| **Nicht verifiziert** | Key aus Konfiguration importiert — **Status aktualisieren** im Server-Dashboard ausführen, um zu verifizieren |

Die Bearbeitungsseite zeigt den Fingerabdruck und bei Bedarf eine Warnung **Nicht verifiziert**, führt aber keine Verifizierung aus, bis Sie geänderte Verbindungseinstellungen speichern oder im Dashboard **Status aktualisieren** nutzen.

Ändert sich der Remote-Host-Key (Neuinstallation, MITM), schlägt die nächste Verbindung fehl, bis Sie die Ursache untersucht haben.

## Was das Löschen eines Servers bewirkt

Das Löschen eines Servers entfernt **nur lokale** Daten:

- Entwurfsregeln, Snapshots, Apply-Sitzungen, Vorgangsverlauf für diesen Server

Es **ändert nicht** die UFW-Regeln auf dem Remote-Linux-Host. Der Remote-Firewall-Zustand bleibt unverändert.

## UFW-Lebenszyklus auf einem Server

Vom Server-Dashboard aus können Sie:

1. **Status aktualisieren** — erkennen, ob UFW installiert und aktiv ist (nutzt gecachten Snapshot bis zur Aktualisierung)
2. **UFW installieren**, falls fehlend — Installation und Aktivierung laufen zusammen in einem Vorgang
3. Regeln bearbeiten und anwenden, wenn UFW installiert **und** aktiv ist

Regelbearbeitung ist nur verfügbar, wenn UFW installiert **und** aktiv ist.

## Verwandte Dokumentation

- [SSH-Identitäten](./ssh-identities.md)
- [Server verwalten](../user-guide/manage-servers.md)
- [Fehlerbehebung](../troubleshooting.md)
