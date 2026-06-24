# Configurazione iniziale

Al primo avvio, UFW Remote Manager **non ha utenti**. Devi creare l'account amministratore una volta.

## Pagina di configurazione (`/setup`)

1. Apri l'URL dell'applicazione (es. `http://localhost:3000` o il tuo `APP_URL`)
2. Vieni reindirizzato automaticamente a `/setup`
3. Inserisci nome, email, password e conferma password
4. Clicca **Completa configurazione**

Dopo il successo, sei autenticato e reindirizzato all'elenco server.

## Politica amministratore singolo

La registrazione è **disabilitata** dopo la creazione del primo account. Non c'è auto-registrazione per utenti aggiuntivi nella versione corrente.

Per aggiungere un'altra persona, condividerebbero le credenziali admin (sconsigliato) oppure operi con un account admin per istanza.

## Sessione e accesso

- Le sessioni durano **7 giorni** con refresh sliding
- Esci tramite **Esci** nella barra laterale
- Pagina di accesso: `/login`

## Primo avvio in produzione

Dopo il deployment dietro HTTPS:

1. Configura NPM Proxy Host → `ufw-app:3000`
2. Imposta `APP_URL=https://your-domain.example` in `.env`
3. Apri `https://your-domain.example/setup`
4. Completa la configurazione prima di esporre l'URL ampiamente

Esegui smoke test dopo la configurazione:

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

## Documentazione correlata

- [Avvio rapido](../quick-start.md)
- [Modello di sicurezza](../administration/security-model.md)
