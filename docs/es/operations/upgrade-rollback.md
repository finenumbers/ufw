# Actualización y reversión

## Actualización (recomendada)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

El servicio **migrate** ejecuta `prisma migrate deploy` automáticamente.

Verifique:

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

## Notas de versión

| Versión | Migración | Cambios notables |
|---------|-----------|------------------|
| **v0.9.0** | Sí — elimina tablas de inventario legacy | Interfaz de inventario legacy eliminada |
| **v0.9.1** | No | Limpieza legacy, guardrails de documentación |
| **v0.9.2** | No | Corrección sync aplicación, ciclo de vida banner operaciones, escaneo puertos fuera cola SSH, protección solapamiento |

Al actualizar desde pre-v0.9.0, asegure que migrate complete — datos de inventario legacy purgados.

Fije imagen: `GHCR_IMAGE_TAG=v0.9.20` en `.env`.

v0.9.18: AmneziaWG opcional solo para nodos marcados. Recree el contenedor con `NET_ADMIN` y `/dev/net/tun`. La ruta predeterminada sigue directa.

v0.9.19: La marca de restricción TSPU permanece en el panel y ya no aparece en la barra lateral.

v0.9.20: Tras reiniciar, la única instancia toma el túnel AmneziaWG.

## Reversión

1. Configure `GHCR_IMAGE_TAG` a etiqueta anterior conocida como buena
2. `docker compose ... pull && up -d`
3. Si la migración ya avanzó solo hacia adelante, puede requerirse restaurar copia de BD anterior — pruebe reversión en staging

Las migraciones de base de datos generalmente **no** se revierten automáticamente.

## Cero tiempo de inactividad

App de contenedor único — espere reinicio breve durante `up -d`. Programe ventana de mantenimiento para producción.

## Documentos relacionados

- [GHCR + Compose](../deployment/ghcr-compose.md)
- [Copia de seguridad y restauración](./backup-restore.md)
