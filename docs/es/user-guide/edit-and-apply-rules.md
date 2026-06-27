# Editar y aplicar reglas

Cuando UFW está **instalado y activo** en un servidor, la **tabla de reglas** del panel permite gestionar reglas de firewall.

## Tabla de reglas

Funciones:

- Búsqueda y filtros por columna
- Secciones de grupos con expandir/contraer
- Reordenación por arrastrar y soltar (el orden importa para UFW)
- Colores de fila según [estado de sync](../concepts/ufw-rules-and-states.md)
- Añadir fila, editar en línea, eliminar fila

## Actualizar desde el servidor

Use **Actualizar estado** en el panel (o la actualización desde la barra de herramientas de reglas) para:

1. Detectar el estado UFW por SSH
2. Cargar un nuevo snapshot del servidor
3. Volver a poblar la tabla de reglas desde datos remotos y metadatos locales

Si tiene **cambios sin guardar**, la app muestra un diálogo de confirmación antes de recargar desde el servidor.

Úselo tras cambios manuales en la CLI del servidor o tras una aplicación parcial.

## Resincronización forzada

Si la interfaz advierte sobre deriva o aplicación parcial, use **Resincronización forzada desde el servidor** para reemplazar la alineación local del borrador con el snapshot remoto real antes de seguir editando.

## Importar reglas

Barra de herramientas → importar CSV, XLSX o JSON. Valide las filas importadas en la tabla antes de la vista previa de aplicación.

## Flujo de aplicación

1. Realizar cambios en el borrador
2. **Vista previa de aplicación** — revisar comandos planificados y resumen de diferencias
3. **Confirmar** — se ejecuta por SSH (se rechaza si UFW remoto cambió desde la vista previa — ejecute la vista previa de nuevo)
4. Siga el progreso en el banner de operación

**Guardar reglas** (vista previa de aplicación) está deshabilitado hasta que la clave de host SSH esté **verificada** — ejecute primero **Actualizar estado** si el servidor se importó desde la configuración.

Consulte [Flujo de borrador y aplicación](../concepts/draft-apply-workflow.md) para más detalles.

## Consejos de seguridad

- Mantenga al menos una regla que permita SSH desde su red de administración antes de aplicar reglas deny
- Ejecute la vista previa en producción durante una ventana de mantenimiento
- Compruebe el **Historial de operaciones** tras aplicar para el estado SUCCESS o FAILED

## Documentación relacionada

- [Reglas UFW y estados](../concepts/ufw-rules-and-states.md)
- [Historial de operaciones](./operations-history.md)
