# Server e SSH

Un record **server** rappresenta un host Linux che gestisci. L'app si connette via SSH per eseguire comandi UFW e leggere lo stato del firewall.

## Campi del server

| Campo | Scopo |
|-------|-------|
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

## Verifica SSH al salvataggio

La creazione o l'aggiornamento di un server (host, porta o cambio identità) esegue un **test di connessione SSH automaticamente all'invio**. Non c'è un pulsante di test separato — il salvataggio resta bloccato finché la verifica non riesce.

Al primo collegamento riuscito, l'impronta della chiave host viene memorizzata e il server è contrassegnato come **verificato**.

## Pinning chiave host SSH

| Stato | Significato |
|-------|-------------|
| **Verificata** | Chiave registrata dopo un salvataggio create/update riuscito o **Aggiorna stato** |
| **Non verificata** | Chiave importata dalla configurazione — eseguire **Aggiorna stato** nella dashboard del server per verificare |

La pagina di modifica mostra l'impronta e un avviso non verificato, ma non esegue la verifica finché non si salvano impostazioni di connessione modificate o non si usa **Aggiorna stato** nella dashboard.

Se la chiave host remota cambia (reinstallazione, MITM), la connessione successiva fallisce finché non indaghi.

## Cosa fa l'eliminazione di un server

Eliminare un server rimuove **solo** i dati locali:

- Bozze regole, snapshot, sessioni di apply, cronologia operazioni per quel server

**Non** modifica le regole UFW sull'host Linux remoto. Lo stato del firewall remoto resta invariato.

## Ciclo di vita UFW su un server

Dalla dashboard del server puoi:

1. **Aggiorna stato** — rilevare se UFW è installato e attivo (usa lo snapshot in cache fino all'aggiornamento)
2. **Installa UFW** se assente — installazione e abilitazione avvengono insieme in un'unica operazione
3. Modificare e applicare regole quando UFW è installato **e** attivo

La modifica delle regole è disponibile solo quando UFW è installato **e** attivo.

## Documentazione correlata

- [Identità SSH](./ssh-identities.md)
- [Gestire i server](../user-guide/manage-servers.md)
- [Risoluzione problemi](../troubleshooting.md)
