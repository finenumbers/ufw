# Editar y aplicar reglas

Cuando UFW está **instalado y activo** en un servidor, abra la pestaña **Reglas** para gestionar reglas de firewall.

## Tabla de reglas

Funciones:

- Búsqueda y filtros de columna
- Secciones de grupo con expandir/contraer
- Reordenación por arrastrar y soltar (el orden importa para UFW)
- Colores de fila según [estado de sincronización](../concepts/ufw-rules-and-states.md)
- Añadir fila, editar en línea, eliminar fila

## Actualizar desde el servidor

Haga clic en **Actualizar estado** (o use actualizar en el panel) para:

1. Detectar estado UFW
2. Cargar snapshot del servidor
3. Sincronizar estados de origen del borrador

Úselo tras cambios manuales en la CLI del servidor o tras una aplicación parcial.

## Resincronización forzada

Si la interfaz advierte sobre deriva o aplicación parcial, use **Resincronización forzada desde el servidor** para reemplazar la alineación del borrador local con el snapshot remoto real antes de seguir editando.

## Importar reglas

Barra de herramientas → importar CSV, XLSX o JSON. Valide las filas importadas en la tabla antes de la vista previa de aplicación.

## Flujo de aplicación

1. Realice ediciones en el borrador
2. **Guardar reglas** — revise comandos planificados y resumen de diferencias
3. **Confirmar** — se ejecuta por SSH
4. Observe el banner de operaciones para el progreso

Consulte [Flujo de borrador y aplicación](../concepts/draft-apply-workflow.md) para más detalles.

## Consejos de seguridad

- Mantenga siempre al menos una regla que permita SSH desde su red de administración antes de aplicar reglas deny
- Ejecute la vista previa en producción durante una ventana de mantenimiento
- Revise el **Historial de operaciones** tras aplicar para estado ÉXITO o ERROR

## Documentación relacionada

- [Reglas UFW y estados](../concepts/ufw-rules-and-states.md)
- [Historial de operaciones](./operations-history.md)
