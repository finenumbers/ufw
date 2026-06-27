# Importar y exportar configuración

Puede exportar e importar una **configuración completa de servidores** (todos los servidores, identidades, metadatos de reglas) como JSON **v2**.

## Exportación

1. Desde la página **Servidores**, use **Guardar configuración**
2. Vuelva a introducir su **contraseña de cuenta** (autenticación reforzada)
3. Descargue el archivo JSON

### Advertencia de seguridad importante

El archivo de exportación contiene **contraseñas SSH y claves privadas en texto plano**. Trátelo como un secreto:

- Almacénelo cifrado (bóveda de gestor de contraseñas, disco cifrado)
- Nunca lo suba a git ni lo envíe por canales no seguros
- Se escribe un evento de audit `CONFIG_EXPORT` cuando la exportación tiene éxito

## Importación

1. Use **Cargar configuración** en la página Servidores
2. Seleccione el archivo JSON v2
3. Revise el resumen: servidores a crear, actualizar, eliminar
4. Vuelva a introducir su **contraseña de cuenta** en el diálogo de confirmación
5. Confirme — la importación se ejecuta en una transacción (upsert primero, eliminación al final)

La importación usa los mismos límites de tasa que la exportación (10 intentos por minuto por usuario).

### Comportamiento destructivo

Los servidores **ausentes** del archivo de importación pueden **eliminarse** junto con todas sus reglas y snapshots. Lea atentamente el diálogo de confirmación.

Las claves de host SSH importadas se marcan como **No verificadas** — ejecute **Actualizar estado** en el panel de cada servidor antes de aplicar reglas.

### Límites de importación

- Las importaciones de reglas (CSV, XLSX, JSON) están limitadas a **10 000 filas** por archivo.
- La **vista previa** de importación de configuración está limitada a **10 intentos por minuto** por usuario — espere y reintente si alcanza el límite.

## Exportación vs copia de seguridad Postgres

| Método | Contiene | Mejor para |
|--------|----------|------------|
| **Exportación de configuración (JSON)** | Configuración legible + secretos en texto plano | Migración entre instancias, copia de desastre |
| **Volcado Postgres** | Base de datos completa incl. secretos cifrados | Restauración completa con el mismo `APP_ENCRYPTION_KEY` |
| **Copia de `.env`** | Secretos de ejecución | Necesaria para descifrar credenciales DB tras restaurar |

Para recuperación ante desastres completa, haga copia de **Postgres y** `.env` — véase [Copia de seguridad y restauración](../operations/backup-restore.md).

## Documentación relacionada

- [Registro de audit y exportación](../administration/audit-log-and-export.md)
- [Identidades SSH](./ssh-identities.md)
