# Configurazione iniziale

Al primo avvio viene creato l'unico account amministratore. Dopo di ciò, la registrazione è permanentemente disabilitata.

## Pagina setup (`/setup`)

Disponibile quando **nessun utente esiste** nel database:

1. Aprite `http://localhost:8088/setup` (o il vostro `APP_URL/setup`)
2. Inserite email e password
3. Inviate — siete autenticati e reindirizzati all'app

Se un utente esiste già, `/setup` reindirizza a `/login`.

## Login (`/login`)

Usate email e password dalla configurazione. Le sessioni sono gestite da Better Auth (cookie HTTP-only).

Logout: barra laterale → **Esci**.

## Modello admin singolo

Non esiste UI di gestione utenti. Un account per installazione. Per accesso condiviso, usate un password manager di team e procedure operative — non utenti app separati.

## Limite frequenza setup

I tentativi di setup sono limitati a **5 al minuto per IP client** per rallentare brute force su installazioni fresche.

Quando l'app gira dietro Nginx Proxy Manager in produzione, impostate:

```env
TRUST_PROXY=1
```

Senza di esso, i limiti usano un bucket condiviso singolo e possono essere meno accurati dietro un proxy.

## Prima visita in produzione

1. Deploy stack — vedi [Panoramica deployment](../deployment/overview.md)
2. Aprite `https://your-domain/setup` (deve corrispondere a `APP_URL`)
3. Completate la configurazione prima di esporre l'URL ampiamente
4. Eseguite [smoke test](../operations/smoke-tests.md)

## Documenti correlati

- [Avvio rapido](../quick-start.md)
- [Modello di sicurezza](../administration/security-model.md)
