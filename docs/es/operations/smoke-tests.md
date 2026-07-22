# Pruebas de humo

Ejecute tras despliegue, actualización o recuperación ante desastres.

## Script automatizado

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url https://ufw.example.com
```

| Flag | Propósito |
|------|-----------|
| `--env-file .env` | Cargar variables de producción |
| `--ghcr` | Incluir `docker-compose.ghcr.yml` |
| `--app-url URL` | Comprobar HTTPS público `/api/health` |

Verifica: Postgres saludable, migrate salió 0, app saludable, JSON health incluye versión.

## Comprobación manual de salud

```bash
docker compose --env-file .env ps
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

## Lista de comprobación del navegador

1. `APP_URL/login` — autenticarse
2. **Identidades SSH** — crear o verificar identidad
3. **Servidores** — crear/actualizar; verificación SSH exitosa
4. **Actualizar estado** — snapshot UFW creado
5. **Reglas** — vista previa de aplicación ejecuta; confirmación opcional en servidor de prueba
6. **Historial de operaciones** — entradas recientes visibles
7. **Sincronización inicial** — servidor nuevo sin snapshot recibe sync en segundo plano
8. **Escaneo de puertos** (si activado) — iniciar escaneo; actualizar página a mitad — panel reanuda (v0.9.2)
9. **Aplicar** — tras confirmar, recuento de reglas coincide con remoto

## Primera instalación

Use `APP_URL/setup` una vez para crear cuenta de administrador.

## Documentos relacionados

- [Configuración inicial](../user-guide/initial-setup.md)
- [Administrar servidores](../user-guide/manage-servers.md)
