# Registro de auditoría y exportación

Dos registros complementarios: **registros de operaciones** (progreso de tareas) y **eventos de auditoría** (seguridad y cumplimiento).

## Eventos de auditoría

Escritos en Postgres en acciones sensibles. Ejemplos:

| Acción | Cuándo |
|--------|--------|
| `LOGIN` / `LOGOUT` | Inicio/fin de sesión |
| `APPLY_PREVIEWED` / `APPLY_CONFIRMED` / `APPLY_COMPLETED` / `APPLY_FAILED` | Flujo de aplicación |
| `SNAPSHOT_LOADED` | Snapshot UFW capturado |
| `UFW_ENABLE` | Activación remota tras instalación |
| `PORT_SCAN_STARTED` / `PORT_SCAN_COMPLETED` | Ciclo de vida escaneo de puertos |
| `CONFIG_EXPORT` / `CONFIG_IMPORT` | Transferencia configuración JSON v2 |
| CRUD servidor | Crear/actualizar/eliminar registros de servidor |

Consulte en **Historial de operaciones** → pestaña **Eventos de auditoría** con desplazamiento infinito.

La retención de auditoría sigue el almacenamiento de base de datos — sin purga automática salvo que el operador borre historial.

## Registros de operaciones

Registros técnicos con pasos, estado, marcas de tiempo y mensajes de error. Consulte [Historial de operaciones](../user-guide/operations-history.md).

## Auditoría de exportación de configuración

Cada **Guardar configuración** exitosa crea una entrada de auditoría. El archivo de exportación contiene **secretos SSH descifrados** — protéjalo como un volcado de bóveda de contraseñas.

Flujo de exportación:

1. Confirmación de contraseña (reautenticación)
2. Token de descarga de corta duración
3. Descarga JSON vía ruta API

Límite de tasa: 5 exportaciones por minuto por usuario.

## Borrar historial

**Borrar historial** en la página de operaciones elimina entradas del registro de operaciones según la acción de interfaz. No revierte cambios de servidor ni elimina eventos de auditoría en todos los casos — confirme el texto del diálogo para el comportamiento actual.

No modifica UFW remoto ni borradores locales de reglas.

## Documentos relacionados

- [Importar y exportar configuración](../concepts/import-export-config.md)
- [Modelo de seguridad](./security-model.md)
