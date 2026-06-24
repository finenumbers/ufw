# Tests de fumée

À exécuter après déploiement, mise à niveau ou reprise après sinistre.

## Script automatisé

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url https://ufw.example.com
```

Options :

| Option | Rôle |
|--------|------|
| `--env-file .env` | Charger les variables de production (requiert `NPM_NETWORK` pour compose prod) |
| `--ghcr` | Inclure l'overlay `docker-compose.ghcr.yml` |
| `--app-url URL` | Vérifier aussi `/api/health` HTTPS public via curl |

Le script vérifie :

- Postgres sain
- `ufw-migrate` exited 0
- `ufw-app` healthy
- `/api/health` interne retourne `{"status":"ok","db":"ok"}`

## Vérification de santé manuelle

```bash
docker compose --env-file .env ps
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

## Liste de contrôle navigateur

1. `APP_URL/login` — s'authentifier
2. **Identités SSH** — identité existante ou en créer une
3. **Serveurs** — test SSH réussi
4. **Règles** — aperçu d'application s'exécute (confirmation optionnelle)
5. **Historique des opérations** — entrées récentes visibles

## Première installation

Utilisez `APP_URL/setup` au lieu de `/login` pour créer le compte admin une fois.

## Documentation associée

- [Configuration initiale](../user-guide/initial-setup.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
