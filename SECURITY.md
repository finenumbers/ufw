# Security Policy

## Supported Versions

Security fixes are provided for the latest release tag on the default branch.

| Version | Supported |
| ------- | --------- |
| latest release | yes |
| older tags | no |

## Reporting a Vulnerability

**Do not open public GitHub issues for security vulnerabilities.**

Send a private report with:

- Description of the issue and impact
- Steps to reproduce
- Affected version or commit SHA
- Suggested fix (optional)

We will acknowledge receipt within 5 business days and aim to provide an initial assessment within 14 days.

## Scope

In scope:

- Authentication, session handling, and authorization bypass
- Remote code execution via SSH/UFW command paths
- Secret leakage (credentials, encryption keys, exports)
- SSRF or host validation bypass in SSH target validation
- SQL injection or unsafe deserialization in API/server actions

Out of scope:

- Issues requiring physical access to the host or Docker socket
- Misconfiguration (weak `.env` passwords, exposed Postgres, missing NPM TLS)
- Vulnerabilities in third-party dependencies without a practical exploit path in this app
- Social engineering or phishing against administrators

## Safe Deployment Reminders

- Never commit `.env` or backup files containing secrets to git
- Run the admin UI behind HTTPS (Nginx Proxy Manager or equivalent)
- Restrict network access to the admin UI (VPN, IP allowlist)
- Use strong unique values for `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, and `APP_ENCRYPTION_KEY`
- Rotate secrets if a `.env` file or config export may have been exposed

## Documentation

User and operator guides are available in **seven languages** under [docs/](docs/README.md) (English, German, French, Spanish, Italian, Portuguese, Russian). Security policy remains in this file (English).
