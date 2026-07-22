# Introduzione

**UFW Remote Manager** è un'applicazione web self-hosted per gestire **UFW (Uncomplicated Firewall)** su server Linux remoti tramite **SSH**. Modificate le regole firewall nel browser, visualizzate un'anteprima delle modifiche, confermate esplicitamente e applicateli in modo sicuro — con traccia di audit completa.

Repository: [github.com/finenumbers/ufw](https://github.com/finenumbers/ufw) · Release corrente: **v0.9.2**

## A chi è rivolto?

- **Amministratori di sistema** che gestiscono più server Linux e preferiscono un'interfaccia strutturata alle sessioni ripetute da CLI `ufw`
- **Piccoli team** che necessitano di un punto centrale per bozze firewall, anteprime di applicazione e cronologia operazioni
- **Self-hoster** con infrastruttura dietro un reverse proxy (Nginx Proxy Manager consigliato)

## Cosa fa

| Funzionalità | Descrizione |
|------------|-------------|
| **Gestione SSH** | Connessione con password o chiave privata; pinning della chiave host al primo collegamento |
| **Ciclo di vita UFW** | Rilevamento, installazione e attivazione di UFW in remoto |
| **Tabella regole** | Modifica regole con gruppi, nomi, ricerca, filtri, riordino drag-and-drop |
| **Bozza → applicazione** | Anteprima diff, conferma, poi esecuzione comandi UFW via SSH |
| **Dashboard veloci** | Le pagine server si caricano dagli snapshot Postgres in cache; SSH live solo su aggiornamento |
| **Import / export** | Regole da CSV, XLSX, JSON; configurazione completa server + identità come JSON v2 |
| **Scansione porte (opzionale)** | Scansione TCP esterna con mappatura copertura UFW |
| **Sicurezza** | Credenziali crittografate a riposo; log di audit; password step-up per export configurazione |
| **Lingue** | UI in inglese, tedesco, francese, spagnolo, italiano, portoghese (Brasile), russo |

## Cosa non fa

| Aspettativa | Realtà |
|-------------|--------|
| Sostituisce il reverse proxy | **No.** Nginx Proxy Manager (o simile) termina HTTPS separatamente |
| Gestisce `iptables` grezzo senza UFW | **No.** Destinato a server dove UFW è il front-end firewall |
| Inventario / controllo container Docker | **No.** Rimosso in v0.9.0 — non fa parte dell'ambito attuale |
| SaaS multi-tenant | **No.** Self-hosted a istanza singola; un account admin dopo la configurazione |
| Cluster ad alta disponibilità | **No.** Progettato per **replica app singola** (limiti di frequenza in memoria) |
| Modifiche firewall automatiche silenziose | **No.** L'applicazione richiede sempre conferma esplicita dell'utente |

## Inventario e statistiche

Dopo v0.9.0, **inventario** nell'elenco server indica:

- **Regole salvate** — conteggio regole nei metadati locali (`ruleRecord`)
- **Porte aperte** — conteggio dall'ultima scansione porte esterna riuscita (se abilitata)

Non esiste un pannello container Docker né monitoraggio container remoto.

## Requisiti

### Host di gestione (dove gira Docker)

- Docker e Docker Compose
- Opzionale: Portainer, Nginx Proxy Manager esistente
- Rete dall'container app ai server target su SSH (porta 22 o personalizzata)
- Per la scansione porte: egress dall'host app verso le porte TCP target (non solo `:22`)

### Server target (host Linux gestiti)

- Linux con UFW disponibile (`apt install ufw` o equivalente)
- Accesso SSH con privilegi per eseguire comandi `ufw`
- Porta SSH raggiungibile dall'host di gestione

### Produzione

- URL **HTTPS** pubblico per l'UI admin (`APP_URL`)
- Segreti robusti in `.env` (mai committati in git)

## Prossimi passi

- [Avvio rapido](./quick-start.md) — esecuzione locale in Docker
- [Architettura](./architecture.md) — componenti, flusso dati, concorrenza
- [Panoramica deployment](./deployment/overview.md) — produzione dietro NPM
