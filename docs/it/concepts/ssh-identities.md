# Identità SSH

Un'**identità SSH** memorizza credenziali di connessione riutilizzabili: nome utente, metodo di autenticazione e segreti crittografati. Ogni **server** fa riferimento a un'identità.

## Metodi di autenticazione

| Metodo | Segreto memorizzato | Uso tipico |
|--------|---------------|-------------|
| **Password** | Password SSH | Lab semplice o host legacy |
| **Chiave privata** | Chiave privata PEM | Chiavi di produzione senza passphrase |
| **Chiave privata + passphrase** | Chiave e passphrase | Chiavi private crittografate |

I segreti sono crittografati a riposo con **AES-256-GCM** usando `APP_ENCRYPTION_KEY`. Vengono decifrati solo in memoria all'apertura di una connessione SSH.

## Creazione e modifica

1. Barra laterale → **Identità SSH**
2. **Aggiungi identità** o aprite una riga esistente → **Modifica**
3. Campi obbligatori: nome visualizzato, nome utente SSH, metodo auth, segreto/i

In **modifica**, lasciare vuoti i campi password/chiave mantiene il segreto esistente invariato.

La validazione rifiuta nomi vuoti e combinazioni auth non valide prima del salvataggio.

## Collegamento ai server

Creando o modificando un server, selezionate un'identità dal menu a tendina. Cambiare l'identità di un server attiva la verifica SSH al salvataggio se i parametri di connessione sono cambiati.

## Eliminazione di un'identità

L'eliminazione è bloccata finché un server fa ancora riferimento all'identità. L'UI elenca i server collegati. Riassegnate o eliminate prima quei server.

## Note di sicurezza

- I segreti delle identità compaiono nell'**export configurazione** (JSON v2) dopo conferma password — trattate gli export come altamente sensibili
- Ruotare `APP_ENCRYPTION_KEY` senza reinserire i segreti rende il ciphertext esistente illeggibile — pianificate la rotazione chiavi con attenzione
- Un'identità può essere condivisa da molti server (stesso utente admin, stessa chiave)

## Documenti correlati

- [Server e SSH](./servers-and-ssh.md)
- [Importazione ed esportazione configurazione](./import-export-config.md)
- [Modello di sicurezza](../administration/security-model.md)
