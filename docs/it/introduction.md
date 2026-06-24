# Introduzione

**UFW Remote Manager** è un'applicazione web self-hosted per gestire **UFW (Uncomplicated Firewall)** su server Linux remoti tramite **SSH**. Modifichi le regole firewall nel browser, visualizzi l'anteprima delle modifiche, confermi esplicitamente e le applichi in modo sicuro — con traccia di audit completa.

Repository: [github.com/finenumbers/ufw](https://github.com/finenumbers/ufw)

## A chi è rivolto?

- **Amministratori di sistema** che gestiscono più server Linux e preferiscono un'interfaccia strutturata alle sessioni manuali da CLI `ufw`
- **Piccoli team** che necessitano di un punto centralizzato per bozze firewall, anteprime di applicazione e cronologia operazioni
- **Self-hoster** che gestiscono la propria infrastruttura dietro un reverse proxy (Nginx Proxy Manager consigliato)

## Cosa fa

- Connessione a server Linux via SSH (password o chiave privata)
- Rilevamento, installazione e attivazione remota di UFW
- Caricamento delle regole UFW live, modifica in tabella (con gruppi, nomi, ricerca, riordino)
- Workflow **bozza → anteprima → conferma → applicazione** con visualizzazione del diff
- Importazione regole da CSV, XLSX o JSON; esportazione/importazione della configurazione completa dei server
- Crittografia delle credenziali SSH a riposo; pinning delle chiavi host SSH; audit delle azioni sensibili
- Interfaccia multilingue (inglese, tedesco, francese, spagnolo, italiano, portoghese, russo)

## Cosa non fa

| Aspettativa | Realtà |
|-------------|---------|
| Sostituisce il reverse proxy | **No.** Nginx Proxy Manager (o simile) termina HTTPS separatamente |
| Gestisce `iptables` grezzo senza UFW | **No.** È pensato per server dove UFW è il front-end del firewall |
| SaaS multi-tenant | **No.** Self-hosted a istanza singola; un account amministratore dopo la configurazione |
| Cluster ad alta disponibilità | **No.** Progettato per **replica singola dell'app** (limiti di frequenza in memoria) |
| Modifiche automatiche al firewall senza conferma | **No.** L'applicazione richiede sempre conferma esplicita dell'utente |

## Requisiti

### Host di gestione (dove gira Docker)

- Docker e Docker Compose
- Opzionale: Portainer, installazione esistente di Nginx Proxy Manager
- Accesso di rete dal container dell'app ai server di destinazione su SSH (porta 22 o personalizzata)

### Server di destinazione (host Linux gestiti)

- Linux con UFW disponibile (`apt install ufw` o equivalente)
- Accesso SSH con privilegi sufficienti per eseguire comandi `ufw`
- Connettività in uscita dall'host di gestione verso la porta SSH del server

### Produzione

- URL **HTTPS** pubblico per l'interfaccia admin (`APP_URL`)
- Segreti robusti in `.env` (mai committati in git)

## Prossimi passi

- [Avvio rapido](./quick-start.md) — esecuzione locale in Docker
- [Architettura](./architecture.md) — come si integrano i componenti
- [Panoramica deployment](./deployment/overview.md) — produzione dietro NPM
