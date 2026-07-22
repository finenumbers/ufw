# UFW Remote Manager — Documentazione (Italiano)

Guida completa per amministratori e operatori. Allineata alla **v0.9.6**.

## Per iniziare

| Documento | Descrizione |
|----------|-------------|
| [Introduzione](./introduction.md) | Ambito del prodotto, requisiti, cosa non fa |
| [Avvio rapido](./quick-start.md) | Setup Docker locale in pochi minuti |
| [Architettura](./architecture.md) | Componenti, SSR cache-first, modello dati, concorrenza |

## Concetti

| Documento | Descrizione |
|----------|-------------|
| [Identità SSH](./concepts/ssh-identities.md) | Credenziali riutilizzabili crittografate |
| [Server e SSH](./concepts/servers-and-ssh.md) | Validazione host, chiavi host, verifica |
| [Regole UFW e stati](./concepts/ufw-rules-and-states.md) | Modello delle regole e colori degli stati di origine |
| [Workflow bozza e applicazione](./concepts/draft-apply-workflow.md) | Modifica, anteprima, conferma, applicazione via SSH |
| [Importazione ed esportazione configurazione](./concepts/import-export-config.md) | Backup completo JSON v2 |
| [Operazioni e concorrenza](./concepts/operations-and-concurrency.md) | Banner, polling, code, limiti di frequenza |

## Guida utente

| Documento | Descrizione |
|----------|-------------|
| [Configurazione iniziale](./user-guide/initial-setup.md) | Primo account amministratore e accesso |
| [Gestire i server](./user-guide/manage-servers.md) | Aggiungere, modificare, eliminare; dashboard e sincronizzazione |
| [Modificare e applicare regole](./user-guide/edit-and-apply-rules.md) | Modifica tabella, importazione, anteprima applicazione |
| [Cronologia operazioni](./user-guide/operations-history.md) | Banner di progresso e pagina cronologia |
| [Scansione porte](./user-guide/port-scan.md) | Risultati della scansione esterna e copertura UFW |

## Amministrazione

| Documento | Descrizione |
|----------|-------------|
| [Modello di sicurezza](./administration/security-model.md) | Crittografia, autenticazione, esposizione di rete |
| [Variabili d'ambiente](./administration/environment-variables.md) | Riferimento completo alla configurazione di runtime |
| [Log di audit ed esportazione](./administration/audit-log-and-export.md) | Eventi di audit ed esportazione con step-up |

## Deployment

| Documento | Descrizione |
|----------|-------------|
| [Panoramica](./deployment/overview.md) | Scegliere un metodo di deployment |
| [GHCR + Compose](./deployment/ghcr-compose.md) | Pull di immagini precompilate (consigliato) |
| [Portainer](./deployment/portainer.md) | Deploy tramite stack Portainer |
| [Nginx Proxy Manager](./deployment/nginx-proxy-manager.md) | Checklist reverse proxy HTTPS |
| [Scansione porte esterna](./deployment/port-scan.md) | Abilitare la scansione porte, rete, timeout |

## Operazioni

| Documento | Descrizione |
|----------|-------------|
| [Backup e ripristino](./operations/backup-restore.md) | Backup di Postgres e `.env` |
| [Aggiornamento e rollback](./operations/upgrade-rollback.md) | Aggiornamenti di versione e ripristino |
| [Smoke test](./operations/smoke-tests.md) | Verifica post-deploy |

## Riferimento

| Documento | Descrizione |
|----------|-------------|
| [FAQ](./faq.md) | Domande frequenti |
| [Risoluzione problemi](./troubleshooting.md) | Sintomo → causa → soluzione |
| [Informazioni su Finenumbers](./about.md) | Autore e contatti |

---

Developed by **[Finenumbers](https://finenumbers.com)** — business phone operator for business · [apps@finenumbers.com](mailto:apps@finenumbers.com)

Altre lingue: [Hub documentazione](../README.md)
