# Editar y aplicar reglas

Cuando UFW está **instalado y activo**, la **tabla de reglas** en el panel del servidor es la superficie principal de edición.

## Funciones de la tabla de reglas

| Función | Descripción |
|---------|-------------|
| **Buscar** | Filtrar filas visibles |
| **Filtros de columna** | Filtrar por grupo o nombre |
| **Secciones de grupo** | Expandir/contraer filas agrupadas |
| **Arrastrar y soltar** | Reordenar reglas (el orden afecta UFW) |
| **Colores de fila** | Indicadores de [estado de origen](../concepts/ufw-rules-and-states.md) |
| **Edición en línea** | Doble clic o acción editar en fila |
| **Añadir / eliminar** | Barra de herramientas y acciones de fila |
| **Cargar más** | Desplazamiento infinito para conjuntos grandes de reglas |

## Actualizar desde servidor

**Actualizar estado** en el panel (o sincronizar desde la barra de herramientas):

1. Detectar estado UFW por SSH
2. Almacenar nuevo snapshot
3. Re-sembrar tabla desde remoto + metadatos locales

Use tras cambios CLI manuales en el servidor o tras aplicación parcial.

Las ediciones de borrador no guardadas activan un diálogo de confirmación antes de recargar.

## Resincronización forzada desde el servidor

Cuando la interfaz advierte deriva o aplicación parcial, use **Resincronización forzada desde el servidor** para alinear el borrador con el snapshot remoto real antes de más ediciones.

Disponible desde el diálogo de vista previa de aplicación y advertencias relacionadas — no sustituye volver a previsualizar cuando el remoto cambió entre vista previa y confirmación.

## Importar reglas

Barra de herramientas → importar **CSV**, **XLSX** o **JSON**:

- Las filas se fusionan en el borrador; duplicados por huella omitidos o fusionados según reglas de importación
- Valide filas en la tabla antes de vista previa de aplicación
- La importación afecta solo al borrador hasta aplicar

## Exportar reglas

Exporte la tabla actual a **XLSX** para revisión offline o copia de seguridad. El diseño XLSX coincide con el orden de columnas de importación para flujos ida y vuelta.

## Flujo de aplicación

1. Editar borrador
2. **Vista previa de aplicación** — revise comandos planificados y recuentos resumen
3. **Confirmar** — ejecuta por SSH (rechazado si el remoto cambió desde la vista previa)
4. Observe el **banner de operaciones** para progreso por comando

**Guardar reglas** / aplicar está desactivado hasta que la clave host SSH esté **verificada** — ejecute **Actualizar estado** primero para servidores importados.

Consulte [Flujo de borrador y aplicación](../concepts/draft-apply-workflow.md).

## Consejos de seguridad

- Mantenga al menos una regla que permita SSH desde su red de administración antes de reglas deny
- Ejecute vista previa en producción durante una ventana de mantenimiento
- Consulte **Historial de operaciones** tras aplicar para ÉXITO o ERROR

## Documentos relacionados

- [Reglas UFW y estados](../concepts/ufw-rules-and-states.md)
- [Historial de operaciones](./operations-history.md)
