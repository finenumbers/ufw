# Editar y aplicar reglas

Cuando UFW está **instalado y activo** en un servidor, abra la pestaña **Reglas** para gestionar las reglas del firewall.

## Tabla de reglas

Funciones:

- Búsqueda y filtros por columna
- Secciones de grupos con expandir/contraer
- Reordenación por arrastrar y soltar (el orden importa para UFW)
- Colores de fila según [estado de sincronización](../concepts/ufw-rules-and-states.md)
- Añadir fila, editar en línea, eliminar fila

## Actualizar desde el servidor

Haga clic en **Actualizar** (o use la actualización del panel) para:

1. Detectar el estado UFW
2. Cargar el snapshot del servidor
3. Sincronizar los estados de origen del borrador

Úselo tras cambios manuales en la CLI del servidor o tras una aplicación parcial.

## Resincronización forzada

Si la interfaz advierte sobre deriva o aplicación parcial, use **Resincronización forzada desde el servidor** para reemplazar la alineación local del borrador con el snapshot remoto real antes de seguir editando.

## Importar reglas

Barra de herramientas → importar CSV, XLSX o JSON. Valide las filas importadas en la tabla antes de la vista previa de aplicación.

## Flujo de aplicación

1. Realizar ediciones del borrador
2. **Vista previa de aplicación** — revisar comandos planificados y resumen de diff
3. **Confirmar** — ejecuta por SSH (rechazado si el UFW remoto cambió desde la vista previa — ejecute la vista previa de nuevo)
4. Observe el banner de operación para el progreso

Véase [Flujo de borrador y aplicación](../concepts/draft-apply-workflow.md) para detalles.

## Consejos de seguridad

- Mantenga al menos una regla que permita SSH desde su red de administración antes de aplicar reglas deny
- Ejecute la vista previa en producción durante una ventana de mantenimiento
- Compruebe el **Historial de operaciones** tras aplicar el estado SUCCESS o FAILED

## Documentación relacionada

- [Reglas UFW y estados](../concepts/ufw-rules-and-states.md)
- [Historial de operaciones](./operations-history.md)
