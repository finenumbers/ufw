# Troubleshooting

Symptom → likely cause → fix. For concepts see linked docs.

## Authentication and setup

| Symptom | Cause | Fix |
|---------|-------|-----|
| `/setup` redirects to login | User already exists | Use `/login` |
| Login fails after deploy | Wrong `APP_URL` or HTTP instead of HTTPS | Match NPM domain; set `APP_URL=https://...` |
| Setup rate limit too aggressive | Missing `TRUST_PROXY` behind NPM | Set `TRUST_PROXY=1` |

## SSH and server create

| Symptom | Cause | Fix |
|---------|-------|-----|
| Private IP rejected | Host validation | Use public IP/hostname or `SSH_ALLOWED_CIDRS` |
| Connection refused | Firewall, wrong port, host down | Verify from Docker host: `ssh -p PORT user@host` |
| Auth failed | Wrong identity credentials | Edit identity; re-enter secret |
| Host key warning | First connect or server rebuilt | **Refresh Status** to capture new fingerprint |

## UFW and rules

| Symptom | Cause | Fix |
|---------|-------|-----|
| Apply disabled | Unverified host key | **Refresh Status** |
| Apply rejected after preview | Remote UFW changed | **Apply preview** again |
| Partial apply | Interrupted commands or sync failure | **Force resync from server**; check operations history |
| Preview shows unexpected deletes | Draft drift | **Force resync from server** |
| Rules reappear after delete on server | Stale sync (pre-v0.9.2) | Upgrade to v0.9.2+; force resync |
| Locked out of SSH | Deny rule applied | Console access; fix UFW out-of-band |

## Operations banner

| Symptom | Cause | Fix |
|---------|-------|-----|
| Banner RUNNING forever | Browser disconnected mid-op | Refresh page; wait for sweeper |
| Table stale after sync | Operation end not detected (rare post-v0.9.2) | Refresh browser |
| Idle API traffic | Old version polled forever | Upgrade v0.9.2 — idle poll stops |

## Port scan

| Symptom | Cause | Fix |
|---------|-------|-----|
| Panel missing | Feature disabled | `PORT_SCAN_ENABLED=true` |
| Scan failed timeout | Large port range / slow network | Increase `PORT_SCAN_*_TIMEOUT_MS`; check egress |
| Scan in progress error | Overlap guard | Wait for current scan |
| No findings | All ports filtered closed | Expected; check scan SUCCESS status |
| Progress lost on refresh (old) | SSR only loaded SUCCESS scans | Upgrade v0.9.2 |

## Docker and migrate

| Symptom | Cause | Fix |
|---------|-------|-----|
| `EACCES` prisma in app | Wrong container | `docker compose run --rm migrate` |
| Migrate fails on upgrade | DB permissions or old version | Check `docker compose logs migrate` |
| App unhealthy | Bad secrets or DB down | Logs: `docker compose logs app` |

## Config import/export

| Symptom | Cause | Fix |
|---------|-------|-----|
| Import blocked | Active operations on server | Wait for queue idle |
| Export rate limited | Too many attempts | Wait 60 seconds |
| Decrypted secrets garbled after restore | Wrong `APP_ENCRYPTION_KEY` | Restore matching `.env` |

## Related docs

- [FAQ](./faq.md)
- [Operations and concurrency](./concepts/operations-and-concurrency.md)
- [Environment variables](./administration/environment-variables.md)
