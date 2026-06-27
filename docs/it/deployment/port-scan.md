# Scansione porte esterna

UFW Remote Manager può eseguire una **scansione porte esterna** dal container `ufw-app` verso l'indirizzo `host` di ogni server registrato. La pipeline utilizza:

1. **Naabu** — discovery TCP sulle porte 1–65535 (`host/port/protocol/open`)
2. **Nmap** — rilevamento servizi solo sulle porte scoperte (`-sV`, output XML)

I risultati compaiono in una tabella **sotto le regole UFW** nella pagina del server.

## Abilitare

Impostare nell'ambiente dell'app (Compose / Portainer):

```env
PORT_SCAN_ENABLED=true
```

Regolazioni opzionali:

| Variabile | Predefinito | Scopo |
|-----------|-------------|-------|
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | Max porte inviate all'arricchimento Nmap |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `1800000` | Timeout discovery porte complete (30 min) |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Timeout arricchimento |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | Esecuzioni scan memorizzate per server |

Le scansioni ripetute sullo stesso server sono limitate a **una ogni 30 secondi** (fisso nel codice da v0.5.1). Il legacy `PORT_SCAN_RATE_LIMIT_WINDOW_MS` in `.env` viene **ignorato**.

## Requisiti di rete

Il container dell'app deve raggiungere **gli host dei server gestiti sulle porte TCP scansionate**, non solo SSH `:22`. Assicurarsi che routing/regole firewall consentano l'egress dall'host Docker (o rete `ufw-app`) verso i server di destinazione.

Questa funzione scansiona **solo host già registrati in UFW Remote Manager** — destinazioni arbitrarie vengono rifiutate.

## Colonna copertura UFW

Ogni porta aperta viene confrontata con l'ultimo snapshot UFW usando la **semantica external-scan**:

| Valore | Significato |
|--------|-------------|
| **Allowed** | ALLOW/LIMIT in ingresso da **qualsiasi** origine (`From = any`) copre questa porta |
| **Not in UFW** | Porta aperta esternamente ma non coperta da ALLOW in ingresso pubblico — rivedere |
| **Denied** | DENY/REJECT in ingresso da **qualsiasi** origine riguarda questa porta |
| **Unknown** | UFW inattivo o nessuno snapshot |

Le regole whitelist (`From = specific IP/CIDR`, `To Port = any`) **non** contano come consentite per external scan. Solo le regole che consentono esplicitamente traffico da ovunque sono trattate come esposizione pubblica.

## Note di sicurezza

- Rate-limited (30 secondi tra scan ripetuti per server; non configurabile via env)
- Eventi audit: `PORT_SCAN_STARTED`, `PORT_SCAN_COMPLETED`
- Le scansioni vengono eseguite nella coda per server insieme alle operazioni SSH (serializzate)
- Usa scan connect (`naabu -scan-type c`, `nmap -sT`) — non servono capacità raw socket

## Polling progresso

Durante una scansione, l'interfaccia effettua polling su un endpoint di stato leggero (non riletture SSH complete). L'intervallo di polling aumenta: **3s → 5s → 10s** man mano che procede l'esecuzione. Il banner operazione mostra il progresso per passo.

## Documentazione correlata

- [Panoramica distribuzione](./overview.md)
- [Modello di sicurezza](../administration/security-model.md)
