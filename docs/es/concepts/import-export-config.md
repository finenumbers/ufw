# Importar y exportar configuración

Puede exportar e importar la **configuración completa de servidores** (todos los servidores, identidades, metadatos de reglas) como JSON **v2**.

## Exportar

1. Desde la página **Servidores**, use **Guardar configuración**
2. Vuelva a introducir su **contraseña de cuenta** (autenticación reforzada)
3. Descargue el archivo JSON

### Advertencia de seguridad importante

El archivo de exportación contiene **contraseñas SSH y claves privadas en texto plano**. Trátelo como un secreto:

- Almacénelo cifrado (caja fuerte de gestor de contraseñas, disco cifrado)
- Nunca lo suba a git ni lo envíe por canales no seguros
- Se escribe un evento de auditoría `CONFIG_EXPORT` cuando la exportación tiene éxito

## Importar

1. Use **Cargar configuración** en la página Servidores
2. Seleccione el archivo JSON v2
3. Revise el resumen: servidores a crear, actualizar, eliminar
4. Confirme — la importación se ejecuta en una transacción (upsert primero, eliminación al final)

### Comportamiento destructivo

Los servidores **ausentes** del archivo de importación pueden **eliminarse** junto con todas sus reglas y snapshots. Lea el diálogo de confirmación con atención.

Las claves host SSH importadas pueden marcarse como **no verificadas** hasta que ejecute prueba SSH en cada servidor.

## Exportación frente a copia de seguridad de Postgres

| Método | Contiene | Mejor para |
|--------|----------|----------|
| **Exportación de configuración (JSON)** | Configuración legible + secretos en texto plano | Migración entre instancias, copia de desastre |
| **Volcado Postgres** | Base de datos completa incluyendo secretos cifrados | Restauración completa con la misma `APP_ENCRYPTION_KEY` |
| **Copia de seguridad de `.env`** | Secretos en tiempo de ejecución | Necesaria para descifrar credenciales de BD tras restauración |

Para recuperación completa ante desastres, haga copia de seguridad de **Postgres y `.env`** — consulte [Copia de seguridad y restauración](../operations/backup-restore.md).

## Documentación relacionada

- [Registro de auditoría y exportación](../administration/audit-log-and-export.md)
- [Identidades SSH](./ssh-identities.md)
