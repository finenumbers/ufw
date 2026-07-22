# Initial setup

First launch creates the only administrator account. After that, registration is permanently disabled.

## Setup page (`/setup`)

Available when **no user exists** in the database:

1. Open `http://localhost:8088/setup` (or your `APP_URL/setup`)
2. Enter email and password
3. Submit — you are signed in and redirected to the app

If a user already exists, `/setup` redirects to `/login`.

## Login (`/login`)

Use the email and password from setup. Sessions are managed by Better Auth (HTTP-only cookies).

Logout: sidebar → **Logout**.

## Single admin model

There is no user management UI. One account per installation. For shared access, use a team password manager and operational procedures — not separate app users.

## Setup rate limiting

Setup attempts are limited to **5 per minute per client IP** to slow brute force on fresh installs.

When the app runs behind Nginx Proxy Manager in production, set:

```env
TRUST_PROXY=1
```

Without it, rate limits use a single shared bucket and may be less accurate behind a proxy.

## Production first visit

1. Deploy stack — see [Deployment overview](../deployment/overview.md)
2. Open `https://your-domain/setup` (must match `APP_URL`)
3. Complete setup before exposing the URL broadly
4. Run [smoke tests](../operations/smoke-tests.md)

## Related docs

- [Quick start](../quick-start.md)
- [Security model](../administration/security-model.md)
