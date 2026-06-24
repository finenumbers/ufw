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

## SSH-Test vor dem Speichern

Das Anlegen oder Aktualisieren eines Servers (Host-, Port- oder Identitätsänderung) erfordert einen erfolgreichen **SSH-Verbindungstest**. Die Oberfläche blockiert das Speichern, bis der Test bestanden ist.

## SSH-Host-Key-Pinning

Bei der ersten erfolgreichen Verbindung wird der SSH-Host-Key-Fingerabdruck des Servers gespeichert.

| Zustand | Bedeutung |
|---------|-----------|
| **Verifiziert** | Key nach erfolgreichem SSH-Test oder normalem Betrieb gespeichert |
| **Nicht verifiziert** | Key aus Konfigurationsdatei importiert — SSH-Test zur Verifizierung ausführen |

Ändert sich der Remote-Host-Key (Neuinstallation, MITM), schlägt die nächste Verbindung fehl, bis Sie die Ursache untersucht haben.

## Was das Löschen eines Servers bewirkt

Das Löschen eines Servers entfernt **nur lokale** Daten:

- Entwurfsregeln, Snapshots, Apply-Sitzungen, Vorgangsverlauf für diesen Server

Es **ändert nicht** die UFW-Regeln auf dem Remote-Linux-Host. Der Remote-Firewall-Zustand bleibt unverändert.

## UFW-Lebenszyklus auf einem Server

Vom Server-Dashboard aus können Sie:

1. UFW **erkennen** — installiert? aktiv?
2. UFW **installieren**, falls fehlend
3. UFW **aktivieren** und Regeln synchronisieren

Regelbearbeitung ist nur verfügbar, wenn UFW installiert **und** aktiv ist.

## Verwandte Dokumentation

- [SSH-Identitäten](./ssh-identities.md)
- [Server verwalten](../user-guide/manage-servers.md)
- [Fehlerbehebung](../troubleshooting.md)
