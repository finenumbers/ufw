# Introduction

**UFW Remote Manager** is a self-hosted web application for managing **UFW (Uncomplicated Firewall)** on remote Linux servers over **SSH**. You edit firewall rules in a browser, preview changes, confirm explicitly, and apply them safely — with a full audit trail.

Repository: [github.com/finenumbers/ufw](https://github.com/finenumbers/ufw) · Current release: **v0.9.6**

## Who is it for?

- **System administrators** managing several Linux servers who prefer a structured UI over repeated `ufw` CLI sessions
- **Small teams** needing one central place for firewall drafts, apply previews, and operation history
- **Self-hosters** running infrastructure behind a reverse proxy (Nginx Proxy Manager recommended)

## What it does

| Capability | Description |
|------------|-------------|
| **SSH management** | Connect with password or private key; host key pinning on first connect |
| **UFW lifecycle** | Detect, install, and enable UFW remotely |
| **Rules table** | Edit rules with groups, names, search, filters, drag-and-drop reorder |
| **Draft → apply** | Preview diff, confirm, then execute UFW commands over SSH |
| **Fast dashboards** | Server pages load from cached Postgres snapshots; live SSH only on refresh |
| **Import / export** | Rules from CSV, XLSX, JSON; full server + identity config as JSON v2 |
| **Port scan (optional)** | External TCP scan with UFW coverage mapping |
| **Security** | Encrypted credentials at rest; audit log; step-up password for config export |
| **Languages** | UI in English, German, French, Spanish, Italian, Portuguese (Brazil), Russian |

## What it does not do

| Expectation | Reality |
|-------------|---------|
| Replaces your reverse proxy | **No.** Nginx Proxy Manager (or similar) terminates HTTPS separately |
| Manages raw `iptables` without UFW | **No.** Targets servers where UFW is the firewall front-end |
| Remote container inventory / control | **No.** Removed in v0.9.0 — not part of current scope |
| Multi-tenant SaaS | **No.** Single-instance self-hosted; one admin account after setup |
| High-availability cluster | **No.** Designed for **single app replica** (in-memory rate limits) |
| Silent automatic firewall changes | **No.** Apply always requires explicit user confirmation |

## Inventory and statistics

After v0.9.0, **inventory** on the servers list means:

- **Saved rules** — count of rules stored in local metadata (`ruleRecord`)
- **Open ports** — count from the latest successful external port scan (when enabled)

There is no remote container panel or container inventory monitoring.

## Requirements

### Management host (where Docker runs)

- Docker and Docker Compose
- Optional: Portainer, existing Nginx Proxy Manager
- Network from the app container to target servers on SSH (port 22 or custom)
- For port scan: egress from the app host to target TCP ports (not only `:22`)

### Target servers (managed Linux hosts)

- Linux with UFW available (`apt install ufw` or equivalent)
- SSH access with privileges to run `ufw` commands
- Reachable SSH port from the management host

### Production

- Public **HTTPS** URL for the admin UI (`APP_URL`)
- Strong secrets in `.env` (never committed to git)

## Next steps

- [Quick start](./quick-start.md) — run locally in Docker
- [Architecture](./architecture.md) — components, data flow, concurrency
- [Deployment overview](./deployment/overview.md) — production behind NPM
