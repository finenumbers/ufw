# Tests de fumée

Exécuter après déploiement, mise à niveau ou reprise après sinistre.

## Script automatisé

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url https://ufw.example.com
```

| Flag | Rôle |
|------|------|
| `--env-file .env` | Charger variables production |
| `--ghcr` | Inclure `docker-compose.ghcr.yml` |
| `--app-url URL` | Vérifier `/api/health` HTTPS public |

Vérifie : Postgres healthy, migrate terminé 0, app healthy, JSON health inclut version.

## Vérification santé manuelle

```bash
docker compose --env-file .env ps
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

## Checklist navigateur

1. `APP_URL/login` — s'authentifier
2. **Identités SSH** — créer ou vérifier une identité
3. **Serveurs** — créer/mettre à jour ; vérification SSH réussit
4. **Actualiser le statut** — snapshot UFW créé
5. **Règles** — aperçu d'application s'exécute ; confirmation optionnelle sur serveur test
6. **Historique des opérations** — entrées récentes visibles
7. **Sync initiale** — nouveau serveur sans snapshot obtient sync en arrière-plan
8. **Scan de ports** (si activé) — démarrer scan ; actualiser page en cours de scan — panneau reprend (v0.9.2)
9. **Application** — après confirmation, compte de règles correspond au distant

## Première installation

Utiliser `APP_URL/setup` une fois pour créer le compte admin.

## Documentation associée

- [Configuration initiale](../user-guide/initial-setup.md)
- [Gérer les serveurs](../user-guide/manage-servers.md)
