# Reglas UFW y estados

Las reglas se normalizan en un modelo de fila unificado con campos **core** (lo que importa a UFW) y campos de **interfaz** (nombre, grupo, metadatos de color).

## Campos core de la regla

Las columnas habituales incluyen acción (allow/deny/reject), dirección, protocolo, puertos, direcciones origen/destino y modo de registro. El conjunto exacto coincide con la sintaxis expresiva de reglas de UFW — consulte la tabla de reglas en la interfaz.

## Estados de sincronización (colores de fila)

Cada fila tiene un **estado** que muestra cómo los datos del borrador local se relacionan con el último snapshot del servidor:

| Estado | Significado |
|-------|---------|
| **MATCHED** | El borrador coincide con lo que UFW reportó en el servidor |
| **REMOTE_ONLY** | Existe en el snapshot del servidor pero no en su borrador local |
| **LOCAL_ONLY** | En su borrador pero no en el servidor (se añadirá al aplicar) |
| **DRAFT_ONLY** | Edición local aún no aplicada; difiere de la línea base coincidente |

Los colores ayudan a detectar deriva antes de aplicar. Tras **Resincronización forzada desde el servidor**, el borrador local se realinea con el estado remoto.

## Huellas digitales

Cada regla tiene una huella derivada de los campos core. Se usa para emparejar filas entre snapshots y detectar operaciones de reordenación/eliminación durante la planificación de aplicación.

## Agrupación y orden

- **Grupos** — organizan reglas visualmente; el nombre del grupo es metadato de interfaz
- **Orden** — el orden de reglas UFW importa; reordenar puede requerir eliminar y recrear en el servidor durante la aplicación

## Formatos de importación

Las reglas pueden importarse desde **CSV**, **XLSX** o **JSON** mediante la barra de herramientas de reglas. Las filas importadas pasan a ser entradas de borrador — aún requieren aplicación para llegar al servidor.

## Documentación relacionada

- [Flujo de borrador y aplicación](./draft-apply-workflow.md)
- [Editar y aplicar reglas](../user-guide/edit-and-apply-rules.md)
