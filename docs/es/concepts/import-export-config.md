# Importación y exportación de configuración

Puede exportar e importar una **configuración completa de servidores** (todos los servidores, identidades, metadatos de reglas) como JSON **v2**.

## Exportación

1. Desde la página **Servidores**, use **Guardar configuración**
2. Reintroduzca su **contraseña de cuenta** (autenticación reforzada)
3. Descargue el archivo JSON

### Advertencia de seguridad importante

El archivo de exportación contiene **contraseñas SSH y claves privadas en texto plano**. Tráitelo como un secreto:

- Almacénelo cifrado (caja fuerte del gestor de contraseñas, disco cifrado)
- Nunca lo suba a git ni lo envíe por canales no seguros
- Se escribe un evento de auditoría `CONFIG_EXPORT` cuando la exportación tiene éxito

## Importación

1. Use **Cargar configuración** en la página Servidores
2. Seleccione el archivo JSON v2
3. Revise el resumen: servidores a crear, actualizar, eliminar
4. Confirme — la importación se ejecuta en una transacción (upsert primero, eliminación al final)

### Comportamiento destructivo

Los servidores **ausentes** del archivo de importación pueden **eliminarse** junto con todas sus reglas y snapshots. Lea el diálogo de confirmación con atención.

Las claves de host SSH importadas pueden marcarse como **no verificadas** hasta que ejecute el test SSH en cada servidor.

### Límites de importación

- Las importaciones de reglas (CSV, XLSX, JSON) están limitadas a **10 000 filas** por archivo.
- La **vista previa** de importación de configuración está limitada a **10 intentos por minuto** por usuario — espere y reintente si alcanza el límite.

## Exportación vs copia de seguridad Postgres

| Método | Contiene | Ideal para |
|--------|----------|------------|
| **Exportación config (JSON)** | Configuración legible + secretos en texto plano | Migración entre instancias, copia de desastre |
| **Volcado Postgres** | Base de datos completa incluyendo secretos cifrados | Restauración completa con la misma `APP_ENCRYPTION_KEY` |
| **Copia `.env`** | Secretos de ejecución | Necesaria para descifrar credenciales DB tras restauración |

Para recuperación ante desastres completa, haga copia de seguridad de **Postgres y `.env`** — consulte [Copia de seguridad y restauración](../operations/backup-restore.md).

## Documentación relacionada

- [Registro de auditoría y exportación](../administration/audit-log-and-export.md)
- [Identidades SSH](./ssh-identities.md)
