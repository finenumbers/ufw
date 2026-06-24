# FAQ

## General

**What is UFW Remote Manager?**  
A self-hosted web UI to manage UFW firewalls on remote Linux servers over SSH, with draft/apply workflow and audit logging.

**Is it free?**  
MIT licensed open source. You provide infrastructure (Docker host, domain, SSL).

**Who built it?**  
[Finenumbers](https://finenumbers.com) — see [About](./about.md).

## Accounts

**Can I create multiple admin users?**  
Not via self-registration. Only one account is created at `/setup`; further sign-ups are disabled.

**I forgot my password.**  
Reset requires database access or restore from backup. There is no email reset in the default setup.

## Deployment

**Do I need my own Docker image per domain?**  
No. Set `APP_URL` in `.env` at runtime. One GHCR image works for any HTTPS domain.

**Does this include Nginx Proxy Manager?**  
No. NPM (or another reverse proxy) must be installed separately.

**Can I run without HTTPS?**  
Local development uses `http://localhost:8088`. Production expects HTTPS for secure cookies and HSTS.

## Firewall operations

**Does deleting a server remove remote UFW rules?**  
No. Only local database records are deleted.

**What if apply fails halfway?**  
Remote UFW may be partially updated. Use **Force resync from server** and review Operations history. See [Draft and apply workflow](./concepts/draft-apply-workflow.md).

**Can I manage servers on private IPs?**  
Yes, set `SSH_ALLOWED_CIDRS` in `.env` to allow your internal ranges.

## Data and security

**Where are SSH keys stored?**  
Encrypted in Postgres with `APP_ENCRYPTION_KEY`. The `.env` key is mandatory for decryption.

**Is config export safe?**  
Export contains **plaintext secrets**. Password re-entry is required; store exports securely.

## Support

Contact **[apps@finenumbers.com](mailto:apps@finenumbers.com)** for product questions.

Security vulnerabilities: see [SECURITY.md](../../SECURITY.md) — do not open public GitHub issues.
