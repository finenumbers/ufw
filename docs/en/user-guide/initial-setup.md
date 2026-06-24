# Initial setup

On first launch, UFW Remote Manager has **no users**. You must create the administrator account once.

## Setup page (`/setup`)

1. Open the application URL (e.g. `http://localhost:8088` or your `APP_URL`)
2. You are redirected to `/setup` automatically
3. Enter name, email, password, and password confirmation
4. Click **Complete Setup**

After success, you are logged in and redirected to the servers list.

## Single administrator policy

Registration is **disabled** after the first account exists. There is no self-service sign-up for additional users in the current version.

To add another person, they would share the admin credentials (not recommended) or you operate with one admin account per instance.

## Session and login

- Sessions last **7 days** with sliding refresh
- Log out via sidebar **Logout**
- Login page: `/login`

## Production first run

After deploying behind HTTPS:

1. Configure NPM Proxy Host → `ufw-app:8088`
2. Set `APP_URL=https://your-domain.example` in `.env`
3. Open `https://your-domain.example/setup`
4. Complete setup before exposing the URL broadly

Run smoke test after setup:

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

## Related docs

- [Quick start](../quick-start.md)
- [Security model](../administration/security-model.md)
