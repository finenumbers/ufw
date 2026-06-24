# Avvio rapido (locale)

Esegui UFW Remote Manager sulla tua macchina con Docker. Questo percorso è per **valutazione e sviluppo**, non per la produzione.

## 1. Clona e configura

```bash
git clone https://github.com/finenumbers/ufw.git
cd ufw
cp .env.example .env
```

Il `.env` predefinito usa valori adatti allo sviluppo. **Non** usare questi valori predefiniti in produzione.

## 2. Avvia lo stack

```bash
docker compose up -d --build
```

Attendi che tutti i container siano healthy:

```bash
docker compose ps
```

Dovresti vedere `ufw-postgres` (healthy), `ufw-migrate` (exited 0) e `ufw-app` (healthy).

## 3. Apri l'interfaccia

Apri **http://localhost:3000** nel browser.

- **Prima visita:** `/setup` — crea l'unico account amministratore
- **Visite successive:** `/login`

## 4. Primo workflow nell'interfaccia

1. **Identità SSH** (`/identities`) — crea le credenziali (password o chiave privata)
2. **Aggiungi server** — scegli l'identità, inserisci host/porta; il test SSH viene eseguito prima del salvataggio
3. Nella pagina del server — installa/attiva UFW se necessario, poi apri **Regole**
4. Modifica le regole, esegui **Salva regole** con anteprima, conferma per inviare le modifiche via SSH

## Comandi utili

```bash
docker compose logs -f app          # log applicazione
docker compose down                 # ferma lo stack
docker compose down -v              # ferma ed elimina il volume del database
```

## Sviluppo sull'host (opzionale)

Esegui solo Postgres in Docker e l'app sull'host:

```bash
docker compose up -d postgres
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Usa la porta **5434** in `DATABASE_URL` per l'accesso dall'host (vedi `.env.example`).

## Produzione

Per il deployment HTTPS dietro Nginx Proxy Manager, vedi [Panoramica deployment](./deployment/overview.md).
