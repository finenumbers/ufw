# Troubleshooting

Symptom → likely cause → what to do.

## Authentication

| Symptom | Cause | Fix |
|---------|-------|-----|
| Redirect loop on login | `APP_URL` mismatch with browser URL | Set `APP_URL` to exact public HTTPS URL; restart app |
| Login works locally but not via domain | NPM or cookie secure flag | Force SSL in NPM; check `APP_URL` scheme is `https://` |
| `BETTER_AUTH_SECRET is required` | `.env` not loaded | Use `--env-file .env` in compose |
| `APP_URL must use HTTPS in production` | Non-HTTPS `APP_URL` for a real domain | Use `https://your-domain`; `http://localhost` is allowed for smoke/CI only |
| `BETTER_AUTH_SECRET must be at least 32 characters` | Secret too short | Regenerate with `openssl rand -base64 32` |

## Docker / NPM

| Symptom | Cause | Fix |
|---------|-------|-----|
| NPM 502 Bad Gateway | App not on NPM network | Set `NPM_NETWORK`; verify `ufw-app` joins external network |
| Setup page easy to brute-force | Missing `TRUST_PROXY` | Set `TRUST_PROXY=1` when behind NPM |
| `ufw-app` unhealthy | DB down or missing secrets | Check `docker logs ufw-app`, postgres health |
| `ufw-migrate` failed | Migration error | Read `docker logs ufw-migrate`; restore backup if needed |
| `pull access denied` | Private GHCR package | Set package visibility Public or `docker login ghcr.io` |

## SSH

| Symptom | Cause | Fix |
|---------|-------|-----|
| SSH connection fails on save | Wrong credentials, firewall, host down | Verify identity, port, server allows Docker host IP |
| Host validation error | Private IP blocked | Set `SSH_ALLOWED_CIDRS` for internal networks |
| Host key changed | Server reinstall or MITM | Verify fingerprint on server; update after confirmation |
| Unverified host key | Imported from config | Run **Refresh Status** on the server dashboard |

## Rules / apply

| Symptom | Cause | Fix |
|---------|-------|-----|
| Rules page empty / disabled | UFW not active | Install and enable UFW from dashboard |
| Preview shows unexpected deletes | Draft drift | Force resync from server |
| Apply rejected — remote changed | UFW changed between preview and confirm | Run **Apply preview** again (not resync) |
| Partial apply warning | Previous apply interrupted or sync failed | Resync; review remote `ufw status` manually |
| Stuck operation banner | Stale RUNNING/PENDING after disconnect | Refresh the page |
| Locked out of SSH | Applied deny rule | Console/out-of-band access; fix UFW on server directly |

## Data

| Symptom | Cause | Fix |
|---------|-------|-----|
| Credentials invalid after restore | Wrong `APP_ENCRYPTION_KEY` | Restore matching `.env` from backup |
| Cannot decrypt identities | Key rotation without re-entry | Re-enter secrets or restore export JSON |

## Health API

```bash
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

Expected: `{"status":"ok","db":"ok","version":"…"}` (`revision` only outside production)

## Still stuck?

Email **[apps@finenumbers.com](mailto:apps@finenumbers.com)** with version tag, sanitized logs (no secrets), and steps to reproduce.
