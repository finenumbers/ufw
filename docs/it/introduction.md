# Introduzione

**UFW Remote Manager** è un'applicazione web self-hosted per gestire **UFW (Uncomplicated Firewall)** su server Linux remoti via **SSH**. Modificate le regole firewall in un browser, visualizzate le modifiche in anteprima, confermatele esplicitamente e applicatele in sicurezza — con un audit trail completo.

Repository: [github.com/finenumbers/ufw](https://github.com/finenumbers/ufw)

## A chi è rivolto?

- **Amministratori di sistema** che gestiscono più server Linux e preferiscono un'interfaccia strutturata alle sessioni CLI `ufw` manuali
- **Piccoli team** che necessitano di un punto centrale per bozze firewall, anteprime di applicazione e cronologia operazioni
- **Self-hoster** che eseguono la propria infrastruttura dietro un proxy inverso (Nginx Proxy Manager consigliato)

## Cosa fa

- Connettersi a server Linux via SSH (password o chiave privata)
- Rilevare, installare e abilitare UFW da remoto
- Caricare regole UFW live, modificarle in una tabella (con gruppi, nomi, ricerca, riordino)
- Workflow **bozza → anteprima → conferma → applicazione** con visualizzazione diff
- Caricamento rapido della dashboard server da snapshot UFW in cache (SSH live solo all'aggiornamento)
- Importare regole da CSV, XLSX o JSON; esportare/importare configurazione completa server
- Cifrare credenziali SSH a riposo; fissare chiavi host SSH; auditare azioni sensibili
- Interfaccia multilingue (inglese, tedesco, francese, spagnolo, italiano, portoghese, russo)

## Cosa non fa

| Aspettativa | Realtà |
|-------------|--------|
| Sostituisce il proxy inverso | **No.** Nginx Proxy Manager (o simile) termina HTTPS separatamente |
| Gestisce `iptables` grezzo senza UFW | **No.** Destinato a server dove UFW è il front-end firewall |
| SaaS multi-tenant | **No.** Self-hosted istanza singola; un account admin dopo la configurazione |
| Cluster ad alta disponibilità | **No.** Progettato per **una replica app** (rate limit in memoria) |
| Modifiche firewall automatiche senza conferma | **No.** L'applicazione richiede sempre conferma esplicita |

## Requisiti

### Host di gestione (dove gira Docker)

- Docker e Docker Compose
- Opzionale: Portainer, installazione esistente di Nginx Proxy Manager
- Accesso di rete dal container app ai server di destinazione su SSH (porta 22 o personalizzata)

### Server di destinazione (host Linux gestiti)

- Linux con UFW disponibile (`apt install ufw` o equivalente)
- Accesso SSH con privilegi sufficienti per eseguire comandi `ufw`
- Connettività in uscita dall'host di gestione alla porta SSH del server

### Produzione

- URL **HTTPS** pubblico per l'interfaccia admin (`APP_URL`)
- Segreti robusti in `.env` (mai committati in git)

## Prossimi passi

- [Avvio rapido](./quick-start.md) — eseguire localmente in Docker
- [Architettura](./architecture.md) — come si integrano i componenti
- [Panoramica distribuzione](./deployment/overview.md) — produzione dietro NPM
