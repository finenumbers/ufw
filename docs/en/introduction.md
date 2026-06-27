# Introduction

**UFW Remote Manager** is a self-hosted web application for managing **UFW (Uncomplicated Firewall)** on remote Linux servers over **SSH**. You edit firewall rules in a browser, preview changes, confirm explicitly, and apply them safely — with a full audit trail.

Repository: [github.com/finenumbers/ufw](https://github.com/finenumbers/ufw)

## Who is it for?

- **System administrators** who manage several Linux servers and prefer a structured UI over manual `ufw` CLI sessions
- **Small teams** that need one central place for firewall drafts, apply previews, and operation history
- **Self-hosters** who run their own infrastructure behind a reverse proxy (Nginx Proxy Manager recommended)

## What it does

- Connect to Linux servers over SSH (password or private key)
- Detect, install, and enable UFW remotely
- Load live UFW rules, edit them in a table (with groups, names, search, reorder)
- **Draft → preview → confirm → apply** workflow with diff visualization
- Fast server dashboard load from cached UFW snapshots (live SSH only on refresh)
- Import rules from CSV, XLSX, or JSON; export/import full server configuration
- Encrypt SSH credentials at rest; pin SSH host keys; audit sensitive actions
- Multi-language UI (English, German, French, Spanish, Italian, Portuguese, Russian)

## What it does not do

| Expectation | Reality |
|-------------|---------|
| Replaces your reverse proxy | **No.** Nginx Proxy Manager (or similar) terminates HTTPS separately |
| Manages raw `iptables` without UFW | **No.** Targets servers where UFW is the firewall front-end |
| Multi-tenant SaaS | **No.** Single-instance self-hosted; one admin account after setup |
| High-availability cluster | **No.** Designed for **single app replica** (in-memory rate limits) |
| Automatic firewall changes without confirmation | **No.** Apply always requires explicit user confirmation |

## Requirements

### Management host (where Docker runs)

- Docker and Docker Compose
- Optional: Portainer, existing Nginx Proxy Manager installation
- Network access from the app container to target servers on SSH (port 22 or custom)

### Target servers (managed Linux hosts)

- Linux with UFW available (`apt install ufw` or equivalent)
- SSH access with sufficient privileges to run `ufw` commands
- Outbound connectivity from the management host to the server SSH port

### Production

- Public **HTTPS** URL for the admin UI (`APP_URL`)
- Strong secrets in `.env` (never committed to git)

## Next steps

- [Quick start](./quick-start.md) — run locally in Docker
- [Architecture](./architecture.md) — how components fit together
- [Deployment overview](./deployment/overview.md) — production behind NPM
