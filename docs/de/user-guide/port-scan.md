# Portscan (Benutzerhandbuch)

Wenn von Ihrem Administrator aktiviert, entdeckt das **Portscan-Panel** auf jeder Serverseite extern erreichbare TCP-Dienste und vergleicht sie mit Ihren UFW-Regeln.

Administratoren aktivieren und konfigurieren Scans über Umgebungsvariablen — siehe [Externer Portscan (Bereitstellung)](../deployment/port-scan.md).

## Wann das Panel erscheint

Das Panel ist nur sichtbar, wenn `PORT_SCAN_ENABLED=true` in der App-Umgebung. Wenn deaktiviert, zeigt die Serverseite nur UFW-Regeln.

## Scan starten

1. Server-Dashboard öffnen.
2. In der UFW-Dashboard-Toolbar **Scan ports** klicken (oder Portscan-Abschnitt unter der Regeltabelle, falls angezeigt).
3. Ein Vorgangsbanner erscheint mit Schritten: Ziel auflösen → Discovery → Anreicherung → Normalisierung.
4. Ergebnisse füllen die Tabelle, wenn der Scan erfolgreich abgeschlossen ist.

Vollständige TCP-Discovery (Ports 1–65535) kann **30 Minuten oder länger** dauern. Der Scan läuft vom App-Container zur registrierten Hostname- oder IP-Adresse des Servers — nicht über SSH.

## Scan-Zustände

| Status | Bedeutung | UI-Verhalten |
|--------|-----------|--------------|
| **PENDING** | Scan-Job erstellt, noch nicht gestartet | Zeigt *Scanning...*; Polling aktiv |
| **RUNNING** | Naabu/Nmap in Arbeit | Fortschritt über Vorgangsbanner; Tabelle kann leer sein oder vorherige Ergebnisse zeigen |
| **SUCCESS** | Scan abgeschlossen | Vollständige Funde-Tabelle; Datum und Portanzahl im Panel-Header |
| **FAILED** | Fehler oder Timeout | Fehlermeldung angezeigt; vorherige erfolgreiche Ergebnisse können weiter angezeigt werden |

## Fortsetzen nach Seiten-Refresh

Seit v0.9.2 lädt das Öffnen einer Serverseite den **neuesten Scan beliebigen Status** aus der Datenbank — nicht nur den letzten erfolgreichen. Wenn Sie den Browser aktualisieren, während ein Scan `PENDING` oder `RUNNING` ist, setzt das Panel Polling fort und das Vorgangsbanner übernimmt den aktiven Vorgang.

## Ergebnistabelle

| Spalte | Beschreibung |
|--------|--------------|
| **Port** | TCP-Portnummer |
| **Proto** | Protokoll (typischerweise `tcp`) |
| **State** | Üblicherweise `open` für entdeckte Ports |
| **Service** | Dienstname von Nmap wenn verfügbar |
| **Product / Version** | Produkt- und Versionsstring wenn erkannt |
| **UFW** | Abdeckung relativ zu Ihrem neuesten UFW-Snapshot |

### UFW-Abdeckungswerte

Abdeckung nutzt **Extern-Scan-Semantik** — was ein anonymer Client im Internet sehen würde:

| Wert | Bedeutung |
|------|-----------|
| **Allowed** | Inbound ALLOW/LIMIT von **any**-Quelle deckt diesen Port ab |
| **Not in UFW** | Port ist extern offen, aber nicht durch öffentliche Inbound-Allow-Regel abgedeckt — prüfen |
| **Denied** | Inbound DENY/REJECT von **any**-Quelle zielt auf diesen Port |
| **Unknown** | UFW inaktiv oder kein Snapshot verfügbar |

Whitelist-only-Regeln (spezifische Quell-IP/CIDR oder `To Port = any` ohne öffentliches Allow) zählen für Extern-Scan **nicht** als *Allowed*.

## Overlap und Ratenlimits

| Situation | Nachricht / Verhalten |
|-----------|----------------------|
| Scan läuft bereits auf diesem Server | *Für diesen Server läuft bereits ein Portscan.* — auf Abschluss warten |
| Wiederholter Scan innerhalb von 30 Sekunden | Ratenlimit-Nachricht mit Retry-Countdown |

Nur ein aktiver Scan pro Server gleichzeitig. Portscan blockiert UFW-Refresh oder Apply auf demselben Server nicht.

## Bezug zu Serverlisten-Statistiken

Die **Serverliste**-Karte kann eine Offene-Ports-Anzahl aus dem letzten erfolgreichen Scan zeigen. Die Dashboard-Inventarzeile zeigt Scan-Datum und Fundanzahl, wenn ein erfolgreicher Scan existiert.

Gespeicherte Regelzähler auf Listenkarten beziehen sich auf **lokale Regel-Metadaten** (`ruleRecord`), nicht auf Remote-UFW-Regelnummern.

## Vorgangsverlauf

Jeder Scan erstellt einen Vorgangsprotokoll-Eintrag vom Typ `port.scan`. Audit-Ereignisse `PORT_SCAN_STARTED` und `PORT_SCAN_COMPLETED` werden beim Start und erfolgreichen Abschluss erfasst.

Siehe [Vorgangsverlauf](./operations-history.md).

## Verwandte Dokumentation

- [Externer Portscan (Bereitstellung)](../deployment/port-scan.md)
- [Vorgänge und Nebenläufigkeit](../concepts/operations-and-concurrency.md)
- [Server verwalten](./manage-servers.md)
