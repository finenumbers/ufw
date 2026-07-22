# Avvio rapido

Eseguite UFW Remote Manager in locale con Docker. Questo percorso è per **valutazione e sviluppo**, non per la produzione.

## Prerequisiti

- Docker e Docker Compose
- Git
- Porta **8088** libera su localhost (configurabile via `APP_PORT`)

## 1. Clone e configurazione

```bash
git clone https://github.com/finenumbers/ufw.git
cd ufw
cp .env.example .env
```

I valori predefiniti di `.env` funzionano per l'uso locale. I segreti sono precompilati solo per lo sviluppo — generate nuovi valori per qualsiasi deployment condiviso o di produzione.

## 2. Avvio dello stack

```bash
docker compose up -d --build
```

Vengono avviati:

| Servizio | Ruolo |
|---------|------|
| **postgres** | Database PostgreSQL |
| **migrate** | Esegue `prisma migrate deploy` una volta, poi esce |
| **app** | UI Next.js sulla porta 8088 |

Verificate lo stato:

```bash
docker compose ps
docker compose logs -f app
```

## 3. Creare l'account amministratore

Aprite **http://localhost:8088/setup**

- La registrazione è disponibile **solo una volta** — finché non esiste alcun utente
- Dopo la configurazione, `/setup` reindirizza al login
- Usate una password robusta; questo è l'unico account amministratore

## 4. Creare un'identità SSH

1. Barra laterale → **Identità SSH** → **Aggiungi identità**
2. Scegliete l'autenticazione: password, chiave privata o chiave con passphrase
3. Salvate — le credenziali sono crittografate con `APP_ENCRYPTION_KEY`

Vedi [Identità SSH](./concepts/ssh-identities.md).

## 5. Aggiungere un server

1. Barra laterale → **Server** → **Aggiungi server**
2. Inserite nome, host, porta, selezionate l'identità
3. **Crea server** verifica SSH automaticamente

In caso di successo si arriva alla dashboard del server. Il badge UFW mostra lo stato in cache (vuoto fino al primo aggiornamento).

## 6. Aggiornare e lavorare con le regole

1. Fate clic su **Aggiorna stato** — lettura SSH live; crea il primo snapshot UFW
2. Se UFW manca, usate **Installa UFW** (dopo che l'aggiornamento conferma che non è installato)
3. Con UFW attivo, modificate le regole nella tabella
4. **Anteprima applicazione** → revisione → **Conferma** per applicare le modifiche

Se non esiste ancora uno snapshot, può essere eseguita una volta una **sincronizzazione iniziale** automatica in background — vedi [Gestire i server](./user-guide/manage-servers.md).

## Opzionale: abilitare la scansione porte in locale

Aggiungete a `.env`:

```env
PORT_SCAN_ENABLED=true
```

Ricostruite/riavviate il container app. La scansione porte richiede Naabu e Nmap nell'immagine (inclusi nel Dockerfile ufficiale).

## Sviluppo senza app Docker completa

Eseguite solo Postgres in Docker, app sull'host:

```bash
docker compose up -d postgres
npm install
npm run db:migrate
npm run dev
```

L'app ascolta su **http://localhost:8088** (vedi `package.json`).

## Arresto e reset

```bash
docker compose down          # ferma i container
docker compose down -v       # ferma ed elimina il volume del database
```

## Prossimi passi

- [Architettura](./architecture.md)
- [Deployment in produzione](./deployment/overview.md)
- [Modello di sicurezza](./administration/security-model.md)
