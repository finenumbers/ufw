# Server e SSH

Un record **server** rappresenta un host Linux che gestisci. L'app si connette via SSH per eseguire comandi UFW e leggere lo stato del firewall.

## Campi del server

| Campo | Scopo |
|-------|---------|
| **Nome** | Etichetta visualizzata nella barra laterale |
| **Host** | Indirizzo IP o nome DNS (validato prima del salvataggio) |
| **Porta** | Porta SSH (predefinita 22) |
| **Identità SSH** | Credenziali usate per la connessione |

## Validazione host (protezione SSRF)

Prima che un server venga salvato, l'host viene validato:

- I range IP privati (10.x, 172.16–31, 192.168.x) sono **bloccati** per impostazione predefinita
- Gli indirizzi link-local e metadati cloud sono bloccati
- Gli indirizzi IPv6 privati mappati su IPv4 sono bloccati
- Allowlist opzionale: imposta `SSH_ALLOWED_CIDRS` in `.env` (es. `10.0.0.0/8`) per reti interne

Questo impedisce che l'applicazione venga abusata come proxy per scansionare reti interne.

## Controllo risoluzione DNS

La validazione avviene in due fasi:

1. **Al salvataggio** — la stringa hostname viene controllata (letterali privati, host metadati, allowlist CIDR opzionale).
2. **Prima della connessione** — l'hostname viene risolto in un IP e l'**indirizzo risolto** viene controllato con le stesse regole.

Questo chiude le lacune di DNS rebinding dove un hostname pubblico in seguito risolve a un IP privato o di metadati.

## Test SSH prima del salvataggio

La creazione o l'aggiornamento di un server (host, porta o cambio identità) richiede un **test di connessione SSH** riuscito. L'interfaccia blocca il salvataggio finché il test non passa.

## Pinning chiave host SSH

Al primo collegamento riuscito, viene memorizzata l'impronta della chiave host SSH del server.

| Stato | Significato |
|-------|---------|
| **Verificata** | Chiave registrata dopo test SSH riuscito o operazione normale |
| **Non verificata** | Chiave importata dal file di configurazione — esegui test SSH per verificare |

Se la chiave host remota cambia (reinstallazione, MITM), la connessione successiva fallisce finché non indaghi.

## Cosa fa l'eliminazione di un server

Eliminare un server rimuove **solo** i dati locali:

- Bozze regole, snapshot, sessioni di apply, cronologia operazioni per quel server

**Non** modifica le regole UFW sull'host Linux remoto. Lo stato del firewall remoto resta invariato.

## Ciclo di vita UFW su un server

Dalla dashboard del server puoi:

1. **Rilevare** UFW — installato? attivo?
2. **Installare** UFW se assente
3. **Attivare** UFW e sincronizzare le regole

La modifica delle regole è disponibile solo quando UFW è installato **e** attivo.

## Documentazione correlata

- [Identità SSH](./ssh-identities.md)
- [Gestire i server](../user-guide/manage-servers.md)
- [Risoluzione problemi](../troubleshooting.md)
