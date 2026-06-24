# Pruebas de humo

Ejecútelas tras despliegue, actualización o recuperación ante desastres.

## Script automatizado

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url https://ufw.example.com
```

Banderas:

| Bandera | Propósito |
|------|---------|
| `--env-file .env` | Cargar variables de producción (requiere `NPM_NETWORK` para compose prod) |
| `--ghcr` | Incluir overlay `docker-compose.ghcr.yml` |
| `--app-url URL` | Comprobar también `/api/health` HTTPS público con curl |

El script verifica:

- Postgres healthy
- `ufw-migrate` exited 0
- `ufw-app` healthy
- `/api/health` interno devuelve `{"status":"ok","db":"ok"}`

## Comprobación de salud manual

```bash
docker compose --env-file .env ps
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

## Lista de comprobación en el navegador

1. `APP_URL/login` — autenticarse
2. **Identidades SSH** — existe identidad o crear una
3. **Servidores** — prueba SSH exitosa
4. **Reglas** — la vista previa de aplicación se ejecuta (confirmación opcional)
5. **Historial de operaciones** — entradas recientes visibles

## Primera instalación

Use `APP_URL/setup` en lugar de `/login` para crear la cuenta de administrador una sola vez.

## Documentación relacionada

- [Configuración inicial](../user-guide/initial-setup.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
