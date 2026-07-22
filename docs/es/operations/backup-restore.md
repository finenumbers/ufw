# Copia de seguridad y restauración

Proteja **datos PostgreSQL** y **secretos de `.env`**. Las reglas UFW remotas en servidores gestionados no se almacenan en copias de seguridad salvo que estén capturadas en snapshots dentro de la base de datos.

## Qué respaldar

| Elemento | Contiene |
|----------|----------|
| **Volumen Postgres** | Usuarios, identidades (cifradas), servidores, reglas, snapshots, escaneos, auditoría |
| **Archivo `.env`** | `APP_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`, `POSTGRES_PASSWORD`, `APP_URL` |

Sin `.env`, los secretos de identidad cifrados no pueden descifrarse tras restaurar.

Opcional: [exportación JSON v2](../concepts/import-export-config.md) periódica como copia legible ante desastres (incluye secretos descifrados — cifre en reposo).

## Respaldar Postgres

Encuentre el volumen:

```bash
docker volume ls | grep ufw
docker inspect ufw-postgres --format '{{range .Mounts}}{{.Name}}{{end}}'
```

Volcado lógico (recomendado):

```bash
docker exec ufw-postgres pg_dump -U ufw ufw | gzip > ufw-$(date +%F).sql.gz
```

Almacene volcado y `.env` en ubicaciones seguras separadas.

## Restaurar

1. Detenga app: `docker compose ... stop app`
2. Restaure base de datos (en volumen Postgres vacío o nuevo)
3. Restaure `.env` con la **misma** `APP_ENCRYPTION_KEY` que cuando se cifraron los datos
4. `docker compose ... up -d`
5. Ejecute [pruebas de humo](./smoke-tests.md)

## Documentos relacionados

- [Importar y exportar configuración](../concepts/import-export-config.md)
- [Actualización y reversión](./upgrade-rollback.md)
