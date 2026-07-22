# Reglas UFW y estados

La tabla de reglas muestra una **vista unificada**: reglas UFW remotas, metadatos locales y sus ediciones de borrador. Los **colores** de fila reflejan cómo cada fila se relaciona con el servidor y la base de datos.

## Estructura de regla

Cada fila tiene:

| Capa | Campos |
|------|--------|
| **Núcleo** | acción, dirección, protocolo, direcciones, puertos, interfaz, perfil de app, modo de log, comentario, IPv6 |
| **Metadatos de interfaz** | grupo, nombre, notas (almacenados localmente, no se envían a UFW salvo en comentario) |
| **Origen** | estado de sincronización que determina el color de fila |

Las huellas identifican reglas entre recargas remotas y ediciones locales.

## Estados de origen

| Estado | Significado del color | Situación típica |
|--------|----------------------|------------------|
| **MATCHED** | Remoto y metadatos locales coinciden | Regla sincronizada estable |
| **REMOTE_ONLY** | En servidor, no en metadatos locales | Regla remota nueva tras actualizar |
| **LOCAL_ONLY** | En BD local, no en servidor | Añadido pendiente o eliminado remotamente |
| **DRAFT_ONLY** | Edición de borrador aún no aplicada | Fila nueva o campos núcleo cambiados |
| **CONFLICT** | Misma huella, campos núcleo distintos | Deriva — revisar antes de aplicar |
| **DELETED** | Marcada eliminada en borrador | Se eliminará al aplicar |

Los colores ayudan a detectar deriva **antes** de aplicar. Tras **Resincronización forzada desde el servidor**, el borrador se realinea con el snapshot remoto.

## Resaltado de direcciones superpuestas

Reglas distintas pueden coincidir con el mismo tráfico aunque sus huellas difieran — por ejemplo `95.163.183.223` dentro de `95.163.183.192/26`, o un `/24` más amplio que cubre un `/26` existente.

Las filas implicadas en al menos un par así se resaltan en **violeta** en la tabla. Este color tiene prioridad sobre los colores de origen verde/amarillo/rojo. Se resaltan **ambas** filas del par.

La leyenda sobre la tabla incluye una muestra violeta: **Rangos IP o CIDR superpuestos**.

La superposición se calcula desde el borrador actual (misma dirección, misma familia IP, direcciones no `anywhere`). Es **solo una advertencia** — importación y aplicación no se bloquean. Elimine o ajuste direcciones hasta que desaparezca el resaltado violeta.

Típico tras importar: un nuevo host o CIDR se superpone a una regla ya en el servidor. Revise el orden — UFW usa la primera regla coincidente.

## Dos recuentos de reglas

La interfaz muestra recuentos distintos en lugares diferentes:

| Ubicación | Etiqueta | Cuenta |
|-----------|----------|--------|
| Tarjeta **lista de servidores** | reglas guardadas | Filas en `ruleRecord` (metadatos locales) |
| Insignia del **panel** | en la tabla | Filas en la tabla de sesión de borrador activa |

Estos difieren mientras edita, importa o sincroniza. La insignia del panel coincide con la longitud visible de la tabla.

## El orden importa

UFW evalúa reglas en orden. La tabla admite reordenación por arrastre. Aplicar puede emitir operaciones de resincronización de orden cuando la numeración remota diverge del orden de su borrador.

## Metadatos remotos vs locales

- Los **campos núcleo remotos** provienen de la salida parseada de `ufw status numbered`
- **Grupo, nombre, notas** existen solo en UFW Remote Manager salvo que se copien en comentarios de regla UFW
- Aplicar escribe campos núcleo en el servidor; metadatos de interfaz permanecen en Postgres

## Documentos relacionados

- [Flujo de borrador y aplicación](./draft-apply-workflow.md)
- [Editar y aplicar reglas](../user-guide/edit-and-apply-rules.md)
