# UFW Remote Manager — Documentation (English)

Complete guide for administrators and operators. Aligned with **v0.9.6**.

## Getting started

| Document | Description |
|----------|-------------|
| [Introduction](./introduction.md) | Product scope, requirements, what it does not do |
| [Quick start](./quick-start.md) | Local Docker setup in minutes |
| [Architecture](./architecture.md) | Components, cache-first SSR, data model, concurrency |

## Concepts

| Document | Description |
|----------|-------------|
| [SSH identities](./concepts/ssh-identities.md) | Encrypted reusable credentials |
| [Servers and SSH](./concepts/servers-and-ssh.md) | Host validation, host keys, verification |
| [UFW rules and states](./concepts/ufw-rules-and-states.md) | Rule model and origin-state colors |
| [Draft and apply workflow](./concepts/draft-apply-workflow.md) | Edit, preview, confirm, apply over SSH |
| [Import and export config](./concepts/import-export-config.md) | Full JSON v2 backup |
| [Operations and concurrency](./concepts/operations-and-concurrency.md) | Banner, polling, queues, rate limits |

## User guide

| Document | Description |
|----------|-------------|
| [Initial setup](./user-guide/initial-setup.md) | First admin account and login |
| [Manage servers](./user-guide/manage-servers.md) | Add, edit, delete; dashboard and sync |
| [Edit and apply rules](./user-guide/edit-and-apply-rules.md) | Table editing, import, apply preview |
| [Operations history](./user-guide/operations-history.md) | Progress banner and history page |
| [Port scan](./user-guide/port-scan.md) | External scan results and coverage |

## Administration

| Document | Description |
|----------|-------------|
| [Security model](./administration/security-model.md) | Encryption, auth, network exposure |
| [Environment variables](./administration/environment-variables.md) | Full runtime configuration reference |
| [Audit log and export](./administration/audit-log-and-export.md) | Audit events and step-up export |

## Deployment

| Document | Description |
|----------|-------------|
| [Overview](./deployment/overview.md) | Choose a deployment method |
| [GHCR + Compose](./deployment/ghcr-compose.md) | Pull pre-built images (recommended) |
| [Portainer](./deployment/portainer.md) | Deploy via Portainer stack |
| [Nginx Proxy Manager](./deployment/nginx-proxy-manager.md) | HTTPS reverse proxy checklist |
| [External port scanning](./deployment/port-scan.md) | Enable port scan, network, timeouts |

## Operations

| Document | Description |
|----------|-------------|
| [Backup and restore](./operations/backup-restore.md) | Postgres and `.env` backups |
| [Upgrade and rollback](./operations/upgrade-rollback.md) | Version upgrades and recovery |
| [Smoke tests](./operations/smoke-tests.md) | Post-deploy verification |

## Reference

| Document | Description |
|----------|-------------|
| [FAQ](./faq.md) | Common questions |
| [Troubleshooting](./troubleshooting.md) | Symptom → cause → fix |
| [About Finenumbers](./about.md) | Author and contact |

---

Developed by **[Finenumbers](https://finenumbers.com)** — business phone operator for business · [apps@finenumbers.com](mailto:apps@finenumbers.com)

Other languages: [Documentation hub](../README.md)
