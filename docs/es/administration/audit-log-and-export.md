# Registro de auditoría y exportación

Existen dos capas de registro: **registros de operaciones** (técnicos) y **eventos de auditoría** (seguridad/cumplimiento).

## Eventos de auditoría

Escritos en la tabla `audit_event`. Ejemplos:

| Acción | Cuándo |
|--------|------|
| `LOGIN` | Sesión de usuario creada |
| `LOGOUT` | Sesión eliminada |
| `CONFIG_EXPORT` | Configuración de servidores exportada (tras volver a introducir contraseña) |

Consulte en **Historial de operaciones** → pestaña **Eventos de auditoría**.

## Registros de operaciones

Escritos para trabajo de larga duración: aplicación, actualización, instalación, prueba SSH, etc. Incluyen metadatos de pasos y mensajes de éxito/error.

Consulte en **Historial de operaciones** → pestaña **Registros de operaciones** o en el **banner de operaciones** en vivo.

## Trazabilidad de exportación de configuración

Cada exportación exitosa crea un registro de auditoría `CONFIG_EXPORT` con ID de usuario y marca temporal. Úselo para rastrear quién descargó archivos de credenciales en texto plano.

## Retención

La retención de snapshots conserva los últimos **10** snapshots por servidor (purga automática de los más antiguos). La retención de registros de operaciones puede borrarse manualmente desde la interfaz.

Planifique política de copia de seguridad para datos de auditoría si el cumplimiento exige retención prolongada — consulte [Copia de seguridad y restauración](../operations/backup-restore.md).

## Documentación relacionada

- [Importar y exportar configuración](../concepts/import-export-config.md)
- [Historial de operaciones](../user-guide/operations-history.md)
- [SECURITY.md](../../../SECURITY.md)
