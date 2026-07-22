# UFW Remote Manager

Self-hosted web service for remote **UFW** management on Linux servers over **SSH**.

Developed by **[Finenumbers](https://finenumbers.com)** · [apps@finenumbers.com](mailto:apps@finenumbers.com)

## Quick start (local)

```bash
git clone https://github.com/finenumbers/ufw.git
cd ufw
cp .env.example .env
docker compose up -d --build
```

Open **http://localhost:8088** → `/setup` → **SSH Identity** → **Add Server**.

## Documentation

**Full documentation (7 languages, 29 topics):** [docs/README.md](docs/README.md)

| Topic | English |
|-------|---------|
| Introduction | [docs/en/introduction.md](docs/en/introduction.md) |
| Quick start | [docs/en/quick-start.md](docs/en/quick-start.md) |
| Architecture | [docs/en/architecture.md](docs/en/architecture.md) |
| Draft and apply | [docs/en/concepts/draft-apply-workflow.md](docs/en/concepts/draft-apply-workflow.md) |
| Operations and concurrency | [docs/en/concepts/operations-and-concurrency.md](docs/en/concepts/operations-and-concurrency.md) |
| Port scan (user) | [docs/en/user-guide/port-scan.md](docs/en/user-guide/port-scan.md) |
| Production deploy | [docs/en/deployment/overview.md](docs/en/deployment/overview.md) |
| Environment variables | [docs/en/administration/environment-variables.md](docs/en/administration/environment-variables.md) |
| FAQ | [docs/en/faq.md](docs/en/faq.md) |
| Troubleshooting | [docs/en/troubleshooting.md](docs/en/troubleshooting.md) |

## Production (recommended)

```bash
./scripts/generate-production-env.sh .env
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

Images: `ghcr.io/finenumbers/ufw-remote-manager:latest` (current: **v0.9.2**)

## Stack

Next.js · PostgreSQL · Prisma · Better Auth · Docker · GHCR

## Security

SSH credentials encrypted at rest. Explicit confirm before UFW apply. Run behind HTTPS. See [docs/en/administration/security-model.md](docs/en/administration/security-model.md) and [SECURITY.md](SECURITY.md).

## License

MIT — [LICENSE](LICENSE)
