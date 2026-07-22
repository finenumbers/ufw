# Scansione porte esterna (deployment)

Gli amministratori abilitano la scansione porte esterna via variabili d'ambiente. Uso lato utente: [Scansione porte (guida utente)](../user-guide/port-scan.md).

## Cosa fa

Dal container **ufw-app**, l'app scansiona l'indirizzo `host` di ogni server registrato:

1. **Naabu** — discovery TCP porte 1–65535
2. **Nmap** — rilevamento servizi sulle porte scoperte

I risultati sono memorizzati in Postgres e mostrati sulla pagina server. **Nessuna SSH** è usata per la scansione.

## Abilitazione

```env
PORT_SCAN_ENABLED=true
```

Riavviate il container app dopo la modifica. L'immagine deve includere Naabu e Nmap (il Dockerfile ufficiale lo fa).

## Regolazione opzionale

| Variabile | Predefinito | Scopo |
|----------|---------|---------|
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | Limite porte inviate a Nmap |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `1800000` | Timeout discovery (30 min) |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Timeout enrichment (10 min) |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | Scansioni conservate per server |

## Requisiti di rete

Il container app deve raggiungere **gli host server gestiti sulle porte TCP scansionate**, non solo SSH `:22`. Consentite egress dall'host Docker (o rete app) ai server target.

Solo gli **host server registrati** vengono scansionati — target arbitrari rifiutati.

## Concorrenza (v0.9.2)

| Argomento | Comportamento |
|-------|-----------|
| Coda SSH | La scansione porte **non** usa la coda SSH per server — refresh/apply UFW non bloccati per 30+ min |
| Sovrapposizione | Solo una scansione PENDING/RUNNING per server; secondo avvio rifiutato |
| Limite frequenza | 30 secondi tra avvii scan per server (fisso nel codice) |
| SSR | La pagina server carica l'ultima scansione di **qualsiasi stato** — scansioni in corso riprendono dopo refresh |

I risultati persistono via replace atomico (`deleteMany` + `createMany` in una transazione).

## Copertura UFW

Vedi [Guida utente scansione porte](../user-guide/port-scan.md#valori-copertura-ufw) per la semantica colonne.

## Sicurezza

- Audit: `PORT_SCAN_STARTED`, `PORT_SCAN_COMPLETED`
- Scansioni connect-only (`-sT`) — nessuna capability raw socket richiesta
- Disabilitato per impostazione predefinita

## Documenti correlati

- [Variabili d'ambiente](../administration/environment-variables.md)
- [Architettura](../architecture.md)
- [Operazioni e concorrenza](../concepts/operations-and-concurrency.md)
